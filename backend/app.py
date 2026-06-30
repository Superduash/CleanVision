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

import database
import model

# Load environment variables from .env if present
load_dotenv()

app = Flask(__name__)

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

FRONTEND_BUILD = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "build")
)


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
    """Health check endpoint. Used by frontend and deploy monitors."""
    return jsonify({"status": "ok", "mock_mode": model.MOCK_MODE}), 200


# --------------------------------------------------------------------------- #
# Uploaded-image Serving                                                        #
# --------------------------------------------------------------------------- #

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
    return send_from_directory(UPLOAD_FOLDER, filename)


# --------------------------------------------------------------------------- #
# React Frontend (production static serving)                                    #
# Must be defined AFTER all /api/* and /uploads/* routes.                       #
# --------------------------------------------------------------------------- #

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    """Serve the built React app for any non-API route."""
    if path and os.path.exists(os.path.join(FRONTEND_BUILD, path)):
        return send_from_directory(FRONTEND_BUILD, path)
    index_path = os.path.join(FRONTEND_BUILD, "index.html")
    if os.path.exists(index_path):
        return send_from_directory(FRONTEND_BUILD, "index.html")
    return jsonify({"status": "CleanVision API running", "note": "Frontend build not found"}), 200


# --------------------------------------------------------------------------- #
# Entry Point                                                                   #
# --------------------------------------------------------------------------- #

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)