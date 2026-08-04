"""
CleanVision Flask Backend
Hospital cleanliness monitoring API.
"""

import os
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_compress import Compress
from flask_caching import Cache

import database
import model

# Load environment variables from .env if present
load_dotenv()

app = Flask(__name__)

# Initialize Compression (Gzip/Deflate)
Compress(app)

# Initialize Caching (In-memory SimpleCache)
cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})

# --------------------------------------------------------------------------- #
# Configuration                                                                 #
# --------------------------------------------------------------------------- #

app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB upload limit

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")
if ALLOWED_ORIGINS == "*":
    CORS(app)
else:
    CORS(app, origins=[o.strip() for o in ALLOWED_ORIGINS.split(",")])

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
BASELINES_FOLDER = os.path.join(UPLOAD_FOLDER, "baselines")
SCANS_FOLDER = os.path.join(UPLOAD_FOLDER, "scans")
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


# --------------------------------------------------------------------------- #
# Helpers                                                                       #
# --------------------------------------------------------------------------- #

def allowed_file(filename: str) -> bool:
    """Return True if the filename has an allowed image extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def ensure_upload_dirs() -> None:
    """Ensure upload directories exist on startup."""
    os.makedirs(BASELINES_FOLDER, exist_ok=True)
    os.makedirs(SCANS_FOLDER, exist_ok=True)


# --------------------------------------------------------------------------- #
# Startup                                                                       #
# --------------------------------------------------------------------------- #

with app.app_context():
    database.init_db()
    ensure_upload_dirs()


# --------------------------------------------------------------------------- #
# API Routes                                                                    #
# --------------------------------------------------------------------------- #

@app.route("/api/rooms", methods=["POST"])
def create_room():
    """Create a new room with name and block."""
    try:
        name = request.form.get("name", "").strip()
        block = request.form.get("block", "").strip()

        if not name:
            return jsonify({"error": "Room name is required"}), 400
        if not block:
            return jsonify({"error": "Block is required"}), 400
        if len(name) > 100:
            return jsonify({"error": "Room name must be 100 characters or fewer"}), 400

        room_id = database.add_room(name, block)
        return jsonify({"success": True, "room_id": room_id}), 201
    except Exception:
        return jsonify({"error": "Failed to create room"}), 500


@app.route("/api/rooms", methods=["GET"])
@cache.cached(timeout=15, query_string=True)
def get_rooms():
    """Return all rooms with their latest scan info."""
    try:
        rooms = database.get_all_rooms()
        return jsonify({"rooms": rooms}), 200
    except Exception:
        return jsonify({"error": "Failed to fetch rooms"}), 500


@app.route("/api/rooms/<int:room_id>", methods=["GET"])
def get_room(room_id):
    """Return a single room by ID."""
    try:
        room = database.get_room(room_id)
        if room is None:
            return jsonify({"error": "Room not found"}), 404
        return jsonify({"room": room}), 200
    except Exception:
        return jsonify({"error": "Failed to fetch room"}), 500


@app.route("/api/rooms/<int:room_id>/baseline", methods=["POST"])
def upload_baseline(room_id):
    """Upload or replace the baseline (clean reference) image for a room."""
    try:
        room = database.get_room(room_id)
        if room is None:
            return jsonify({"error": "Room not found"}), 404

        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]
        if not file.filename:
            return jsonify({"error": "No image file selected"}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Allowed: jpg, jpeg, png, webp"}), 400

        ext = secure_filename(file.filename).rsplit(".", 1)[1].lower()
        save_filename = f"{room_id}_baseline.{ext}"
        save_path = os.path.join(BASELINES_FOLDER, save_filename)
        file.save(save_path)

        relative_path = f"uploads/baselines/{save_filename}"
        database.set_baseline(room_id, relative_path)

        return jsonify({"success": True, "image_path": relative_path}), 200
    except Exception:
        return jsonify({"error": "Failed to upload baseline image"}), 500


@app.route("/api/scan", methods=["POST"])
def scan_image():
    """Upload a scan image and return an AI cleanliness prediction."""
    try:
        room_id_str = request.form.get("room_id", "")
        if not room_id_str:
            return jsonify({"error": "room_id is required"}), 400

        try:
            room_id = int(room_id_str)
        except ValueError:
            return jsonify({"error": "room_id must be an integer"}), 400

        room = database.get_room(room_id)
        if room is None:
            return jsonify({"error": "Room not found"}), 404

        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]
        if not file.filename:
            return jsonify({"error": "No image file selected"}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Allowed: jpg, jpeg, png, webp"}), 400

        ext = secure_filename(file.filename).rsplit(".", 1)[1].lower()
        timestamp = int(time.time())
        save_filename = f"{room_id}_{timestamp}.{ext}"
        save_path = os.path.join(SCANS_FOLDER, save_filename)
        file.save(save_path)

        prediction = model.predict(save_path)

        relative_path = f"uploads/scans/{save_filename}"
        scan_id = database.add_scan(
            room_id, relative_path, prediction["score"], prediction["status"]
        )

        # Auto-create notification for attention-needed scans
        if prediction["status"] in ("dirty", "needs_attention"):
            status_label = "Dirty" if prediction["status"] == "dirty" else "Needs attention"
            room_name = room.get("name", f"Room {room_id}")
            database.create_notification(
                "scan_result",
                f"{status_label}: {room_name}",
                f"{room_name} scored {prediction['score']}/100. Immediate attention required." if prediction["status"] == "dirty"
                else f"{room_name} scored {prediction['score']}/100. Schedule a cleaning check soon.",
                room_id
            )

        return jsonify(
            {
                "scan_id": scan_id,
                "score": prediction["score"],
                "status": prediction["status"],
                "room_id": room_id,
                "image_path": relative_path,
                "mock": prediction["mock"],
            }
        ), 200
    except Exception:
        return jsonify({"error": "Scan failed. Please try again."}), 500


@app.route("/api/rooms/<int:room_id>/history", methods=["GET"])
def get_history(room_id):
    """Return scan history for a room, most recent first."""
    try:
        room = database.get_room(room_id)
        if room is None:
            return jsonify({"error": "Room not found"}), 404

        limit = request.args.get("limit", 20, type=int)
        limit = max(1, min(limit, 100))  # clamp 1–100
        history = database.get_scan_history(room_id, limit)
        return jsonify({"history": history}), 200
    except Exception:
        return jsonify({"error": "Failed to fetch history"}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint. Used by deploy monitors."""
    return jsonify({"status": "ok", "mock_mode": model.MOCK_MODE}), 200


@app.route("/api/rooms/<int:room_id>", methods=["DELETE"])
def delete_room(room_id):
    """Delete a room and all its scans, including uploaded image files."""
    try:
        image_paths = database.delete_room(room_id)
        if image_paths is None:
            return jsonify({"error": "Room not found"}), 404

        # Clean up uploaded image files from disk
        backend_dir = os.path.dirname(__file__)
        for rel_path in image_paths:
            abs_path = os.path.join(backend_dir, rel_path)
            try:
                if os.path.exists(abs_path):
                    os.remove(abs_path)
            except OSError:
                pass  # best-effort cleanup

        cache.clear()
        return "", 204
    except Exception:
        return jsonify({"error": "Failed to delete room"}), 500


@app.route("/api/scans/<int:scan_id>", methods=["DELETE"])
def delete_scan(scan_id):
    """Delete a single scan record and its uploaded image."""
    try:
        scan = database.get_scan(scan_id)
        if scan is None:
            return jsonify({"error": "Scan not found"}), 404

        database.delete_scan(scan_id)

        # Clean up the scan image file
        if scan.get("image_path"):
            backend_dir = os.path.dirname(__file__)
            abs_path = os.path.join(backend_dir, scan["image_path"])
            try:
                if os.path.exists(abs_path):
                    os.remove(abs_path)
            except OSError:
                pass

        cache.clear()
        return "", 204
    except Exception:
        return jsonify({"error": "Failed to delete scan"}), 500


@app.route("/api/reports/summary", methods=["GET"])
@cache.cached(timeout=60, query_string=True)
def reports_summary():
    """Aggregate cleanliness stats across all rooms for the Reports screen."""
    try:
        days = request.args.get("days", default=7, type=int)
        days = max(1, min(days, 30))  # clamp 1-30
        summary = database.get_reports_summary(days=days)
        return jsonify(summary), 200
    except Exception:
        return jsonify({"error": "Failed to generate report summary"}), 500

@app.route("/api/rooms/<int:room_id>", methods=["PATCH"])
def update_room(room_id):
    """Update a room's name and/or block."""
    try:
        name = request.form.get("name", "").strip()
        block = request.form.get("block", "").strip()
        if not name:
            return jsonify({"error": "Room name is required"}), 400
        if not block:
            return jsonify({"error": "Block is required"}), 400
        if len(name) > 100:
            return jsonify({"error": "Room name must be 100 characters or fewer"}), 400
        updated = database.update_room(room_id, name, block)
        if not updated:
            return jsonify({"error": "Room not found"}), 404
        cache.clear()
        return jsonify({"success": True}), 200
    except Exception:
        return jsonify({"error": "Failed to update room"}), 500


# --------------------------------------------------------------------------- #
# Cleaning Requests                                                             #
# --------------------------------------------------------------------------- #

@app.route("/api/cleaning-requests", methods=["POST"])
def create_cleaning_request():
    """Submit a new cleaning request."""
    try:
        room_id_str = request.form.get("room_id", "")
        if not room_id_str:
            return jsonify({"error": "room_id is required"}), 400
        try:
            room_id = int(room_id_str)
        except ValueError:
            return jsonify({"error": "room_id must be an integer"}), 400

        room = database.get_room(room_id)
        if room is None:
            return jsonify({"error": "Room not found"}), 404

        requested_by_name = request.form.get("requested_by_name", "Patient").strip()
        requested_by_email = request.form.get("requested_by_email", "").strip()
        reason = request.form.get("reason", "").strip()

        req_id = database.create_cleaning_request(room_id, requested_by_name, requested_by_email, reason)

        # Auto-notify admins
        database.create_notification(
            "cleaning_request",
            f"Cleaning requested: {room['name']}",
            f"{requested_by_name} requested cleaning for {room['name']} ({room['block']}). Reason: {reason or 'Not specified'}",
            room_id
        )

        return jsonify({"success": True, "request_id": req_id}), 201
    except Exception:
        return jsonify({"error": "Failed to submit cleaning request"}), 500


@app.route("/api/cleaning-requests", methods=["GET"])
def get_cleaning_requests():
    """List all cleaning requests (optionally filtered by status)."""
    try:
        status_filter = request.args.get("status")
        requests_list = database.get_cleaning_requests(status_filter)
        pending_count = database.get_pending_request_count()
        return jsonify({"requests": requests_list, "pending_count": pending_count}), 200
    except Exception:
        return jsonify({"error": "Failed to fetch cleaning requests"}), 500


@app.route("/api/cleaning-requests/<int:request_id>", methods=["PATCH"])
def update_cleaning_request(request_id):
    """Update cleaning request status (admin action)."""
    try:
        new_status = request.form.get("status", "").strip()
        valid = {"pending", "in_progress", "completed", "dismissed"}
        if new_status not in valid:
            return jsonify({"error": f"Status must be one of: {', '.join(valid)}"}), 400
        updated = database.update_cleaning_request_status(request_id, new_status)
        if not updated:
            return jsonify({"error": "Request not found"}), 404
        return jsonify({"success": True}), 200
    except Exception:
        return jsonify({"error": "Failed to update request"}), 500


@app.route("/api/rooms/<int:room_id>/cleaning-requests", methods=["GET"])
def get_room_cleaning_requests(room_id):
    """Get cleaning requests for a specific room."""
    try:
        room = database.get_room(room_id)
        if room is None:
            return jsonify({"error": "Room not found"}), 404
        requests_list = database.get_room_cleaning_requests(room_id)
        return jsonify({"requests": requests_list}), 200
    except Exception:
        return jsonify({"error": "Failed to fetch requests"}), 500


# --------------------------------------------------------------------------- #
# Notifications                                                                 #
# --------------------------------------------------------------------------- #

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    """List notifications, most recent first."""
    try:
        limit = request.args.get("limit", 50, type=int)
        limit = max(1, min(limit, 200))
        notifications = database.get_notifications(limit)
        unread_count = database.get_unread_notification_count()
        return jsonify({"notifications": notifications, "unread_count": unread_count}), 200
    except Exception:
        return jsonify({"error": "Failed to fetch notifications"}), 500


@app.route("/api/notifications/<int:notification_id>/read", methods=["PATCH"])
def mark_notification_read(notification_id):
    """Mark a notification as read."""
    try:
        updated = database.mark_notification_read(notification_id)
        if not updated:
            return jsonify({"error": "Notification not found"}), 404
        return jsonify({"success": True}), 200
    except Exception:
        return jsonify({"error": "Failed to mark notification"}), 500


@app.route("/api/notifications/mark-all-read", methods=["POST"])
def mark_all_notifications_read():
    """Mark all notifications as read."""
    try:
        database.mark_all_notifications_read()
        return jsonify({"success": True}), 200
    except Exception:
        return jsonify({"error": "Failed to mark all notifications"}), 500


@app.route("/api/notifications/<int:notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    """Delete a notification."""
    try:
        deleted = database.delete_notification(notification_id)
        if not deleted:
            return jsonify({"error": "Notification not found"}), 404
        return "", 204
    except Exception:
        return jsonify({"error": "Failed to delete notification"}), 500


# --------------------------------------------------------------------------- #
# Admin Stats                                                                   #
# --------------------------------------------------------------------------- #

@app.route("/api/admin/stats", methods=["GET"])
def admin_stats():
    """System statistics for admin panel."""
    try:
        stats = database.get_system_stats()
        stats["mock_mode"] = model.MOCK_MODE
        return jsonify(stats), 200
    except Exception:
        return jsonify({"error": "Failed to fetch stats"}), 500




@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    """
    Serve uploaded baseline and scan images.
    Only files inside the uploads directory are accessible.
    """
    # Resolve and validate path to prevent directory traversal
    safe_uploads = os.path.realpath(UPLOAD_FOLDER)
    requested = os.path.realpath(os.path.join(UPLOAD_FOLDER, filename))
    if not requested.startswith(safe_uploads + os.sep):
        return jsonify({"error": "Forbidden"}), 403
    response = send_from_directory(UPLOAD_FOLDER, filename, max_age=31536000)
    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


# --------------------------------------------------------------------------- #
# Entry Point                                                                   #
# --------------------------------------------------------------------------- #

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)