"""
CleanVision Flask Backend — Single-Hospital Architecture
Hospital cleanliness monitoring & public QR issue reporting API.
Enforces Server-Side Firebase Auth verification and Custom Claims for staff roles (admin, manager, inspector).
"""

import os
import time
import tempfile
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_compress import Compress
from flask_caching import Cache

import firebase_config
from firebase_admin import auth
import database
import model

load_dotenv()

app = Flask(__name__)
Compress(app)
cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})

app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")
if ALLOWED_ORIGINS == "*":
    CORS(app)
else:
    CORS(app, origins=[o.strip() for o in ALLOWED_ORIGINS.split(",")])

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def require_auth(allowed_roles=None):
    """
    Decorator verifying Firebase ID token and checking user custom claims role.
    Roles: 'admin', 'manager', 'inspector'
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            id_token = None
            if auth_header.startswith("Bearer "):
                id_token = auth_header.split("Bearer ", 1)[1].strip()

            if not id_token:
                allow_dev = os.environ.get("ALLOW_DEV_AUTH", "false").lower() == "true"
                if allow_dev or not firebase_config.get_db():
                    request.auth_user = {
                        "uid": "dev-user",
                        "email": "dev@hospital.com",
                        "role": "admin",
                        "assignedBlocks": [],
                    }
                else:
                    return jsonify({"error": "Unauthorized: Missing Bearer token in Authorization header"}), 401
            elif id_token.startswith("LOCAL_"):
                # Handle local mock auth token sent by frontend (e.g. LOCAL_inspector)
                if not firebase_config.get_db() or os.environ.get("ALLOW_DEV_AUTH", "false").lower() == "true":
                    # "LOCAL_" is 6 chars — everything after that is the role
                    role_part = id_token[6:] if len(id_token) > 6 else "admin"
                    # Normalize role names: frontend sends role as stored in session
                    role_map = {
                        "admin": "admin",
                        "supervisor": "manager",
                        "manager": "manager",
                        "inspector": "inspector",
                        "staff": "inspector",
                    }
                    role = role_map.get(role_part.lower(), "inspector")
                    request.auth_user = {
                        "uid": "dev-user",
                        "email": "dev@hospital.com",
                        "role": role,
                        "assignedBlocks": [],
                    }
                else:
                    return jsonify({"error": "Unauthorized: Local mock token not allowed in production"}), 401
            else:
                try:
                    decoded = firebase_config.verify_token(id_token)
                    role = decoded.get("role", "inspector")
                    assigned_blocks = decoded.get("assignedBlocks", [])

                    request.auth_user = {
                        "uid": decoded.get("uid"),
                        "email": decoded.get("email"),
                        "role": role,
                        "assignedBlocks": assigned_blocks,
                    }
                except Exception as e:
                    return jsonify({"error": f"Unauthorized: Invalid ID token ({e})"}), 401

            if allowed_roles:
                user_role = request.auth_user.get("role")
                if user_role not in allowed_roles:
                    return jsonify({"error": f"Forbidden: Action requires one of roles: {allowed_roles}"}), 403

            return f(*args, **kwargs)
        return decorated
    return decorator

def save_image_artifact(file_obj, storage_path: str) -> str:
    bucket = firebase_config.get_bucket()
    if bucket:
        blob = bucket.blob(storage_path)
        file_obj.seek(0)
        blob.upload_from_file(file_obj, content_type=file_obj.content_type)
        blob.make_public()
        return blob.public_url
    else:
        local_dir = os.path.join(os.path.dirname(__file__), "uploads", os.path.dirname(storage_path))
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(os.path.dirname(__file__), "uploads", storage_path)
        file_obj.seek(0)
        file_obj.save(local_path)
        return f"uploads/{storage_path}"

with app.app_context():
    firebase_config.init_firebase()
    database.init_db()

# ─────────────────────────────────────────────────────────────────────────────
# Hospital Config & Public Room Lookup
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/hospital/config", methods=["GET"])
def get_hospital_config():
    try:
        config = database.get_hospital_config()
        return jsonify({"config": config}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch hospital config: {e}"}), 500

@app.route("/api/hospital/config", methods=["POST"])
@require_auth(allowed_roles=["admin"])
def update_hospital_config():
    try:
        data = request.get_json(silent=True) or request.form
        updated = database.update_hospital_config(data, updated_by=request.auth_user["uid"])
        cache.clear()
        return jsonify({"success": True, "config": updated}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update hospital config: {e}"}), 500

@app.route("/api/report/lookup/<room_code>", methods=["GET"])
def get_room_lookup(room_code):
    try:
        lookup = database.get_room_lookup(room_code)
        if not lookup:
            return jsonify({"error": "Room code not registered in facility database", "roomLookup": None}), 404
        return jsonify({"roomLookup": lookup}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to lookup room code: {e}"}), 500

# ─────────────────────────────────────────────────────────────────────────────
# Public Issue Reports (Unauthenticated patient/visitor submission)
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/report/submit", methods=["POST"])
def submit_issue_report():
    try:
        room_code = request.form.get("room_code", "").strip() or (request.json or {}).get("room_code", "").strip()
        issue_type = request.form.get("issue_type", "").strip() or (request.json or {}).get("issue_type", "").strip()
        comment = request.form.get("comment", "").strip() or (request.json or {}).get("comment", "").strip()

        if not room_code or not issue_type:
            return jsonify({"error": "room_code and issue_type are required"}), 400

        photo_url = None
        if "photo" in request.files:
            file = request.files["photo"]
            if file and file.filename and allowed_file(file.filename):
                ext = secure_filename(file.filename).rsplit(".", 1)[1].lower()
                timestamp = int(time.time())
                storage_path = f"reports/{room_code}/report_{timestamp}.{ext}"
                photo_url = save_image_artifact(file, storage_path)

        report_id = database.create_issue_report(
            room_code=room_code,
            issue_type=issue_type,
            comment=comment,
            photo_url=photo_url,
        )

        lookup = database.get_room_lookup(room_code)
        block = lookup.get("block", "Block B") if lookup else "Block B"

        database.create_notification(
            type_="issue_report",
            title=f"Visitor Alert: {issue_type}",
            message=f"Reported at {room_code} ({block}). Details: {comment or 'None'}",
            room_id=lookup.get("roomId") if lookup else None,
        )
        cache.clear()

        return jsonify({"success": True, "report_id": report_id}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to submit issue report: {e}"}), 500

@app.route("/api/reports/issues", methods=["GET"])
@require_auth(allowed_roles=["admin", "manager", "inspector"])
def get_issue_reports():
    try:
        status_filter = request.args.get("status")
        block_filter = request.args.get("block")

        if request.auth_user["role"] == "inspector" and not block_filter:
            assigned = request.auth_user.get("assignedBlocks", [])
            if assigned:
                block_filter = assigned[0]

        reports = database.get_issue_reports(status_filter=status_filter, block_filter=block_filter)
        open_count = len([r for r in reports if r.get("status") == "open"])
        return jsonify({"reports": reports, "open_count": open_count}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch issue reports: {e}"}), 500

@app.route("/api/reports/issues/<report_id>", methods=["PATCH"])
@require_auth(allowed_roles=["admin", "manager", "inspector"])
def update_issue_report(report_id):
    try:
        data = request.get_json(silent=True) or request.form
        new_status = data.get("status", "").strip()
        valid = {"open", "in_progress", "resolved", "dismissed"}
        if new_status not in valid:
            return jsonify({"error": f"Status must be one of: {', '.join(valid)}"}), 400

        updated = database.update_issue_report_status(report_id, new_status, resolved_by=request.auth_user["uid"])
        if not updated:
            return jsonify({"error": "Report not found"}), 404
        cache.clear()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update report status: {e}"}), 500

# ─────────────────────────────────────────────────────────────────────────────
# Staff Provisioning Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/admin/managers", methods=["POST"])
@require_auth(allowed_roles=["admin"])
def create_manager():
    try:
        data = request.get_json(silent=True) or request.form
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        name = data.get("name", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        try:
            user = auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            user = auth.create_user(email=email, password=password, display_name=name or email.split("@")[0])

        firebase_config.set_user_claims(user.uid, role="manager", assigned_blocks=[])
        cache.clear()

        return jsonify({"success": True, "uid": user.uid, "email": email, "role": "manager"}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create manager: {e}"}), 500

@app.route("/api/manager/inspectors", methods=["POST"])
@require_auth(allowed_roles=["admin", "manager"])
def create_inspector():
    try:
        data = request.get_json(silent=True) or request.form
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        name = data.get("name", "").strip()
        assigned_blocks = data.get("assignedBlocks", []) or data.get("assigned_blocks", [])

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        try:
            user = auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            user = auth.create_user(email=email, password=password, display_name=name or email.split("@")[0])

        firebase_config.set_user_claims(user.uid, role="inspector", assigned_blocks=assigned_blocks)
        cache.clear()

        return jsonify({"success": True, "uid": user.uid, "email": email, "role": "inspector", "assignedBlocks": assigned_blocks}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create inspector: {e}"}), 500

@app.route("/api/admin/staff", methods=["GET"])
@require_auth(allowed_roles=["admin", "manager"])
def list_staff():
    try:
        staff = database.get_staff_users()
        return jsonify({"staff": staff}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to list staff: {e}"}), 500

# ─────────────────────────────────────────────────────────────────────────────
# Rooms & Scans
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/rooms", methods=["POST"])
@require_auth(allowed_roles=["admin", "manager"])
def create_room():
    try:
        data = request.get_json(silent=True) or request.form
        name = data.get("name", "").strip()
        block = data.get("block", "").strip()
        floor = data.get("floor", "Floor 1").strip()
        room_number = data.get("roomNumber", "").strip()

        if not name or not block:
            return jsonify({"error": "Room name and block are required"}), 400

        room_id, room_code = database.add_room(name=name, block=block, floor=floor, room_number=room_number, created_by=request.auth_user["uid"])
        cache.clear()
        return jsonify({"success": True, "room_id": room_id, "room_code": room_code}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create room: {e}"}), 500

@app.route("/api/rooms", methods=["GET"])
@require_auth()
def get_rooms():
    try:
        block = request.args.get("block")
        rooms = database.get_all_rooms(block_filter=block)
        return jsonify({"rooms": rooms}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch rooms: {e}"}), 500

@app.route("/api/rooms/<room_id>", methods=["GET"])
@require_auth()
def get_room(room_id):
    try:
        room = database.get_room(room_id)
        if not room:
            return jsonify({"error": "Room not found"}), 404
        return jsonify({"room": room}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch room: {e}"}), 500

@app.route("/api/rooms/<room_id>/baseline", methods=["POST"])
@require_auth(allowed_roles=["admin", "manager", "inspector"])
def upload_baseline(room_id):
    try:
        room = database.get_room(room_id)
        if not room:
            return jsonify({"error": "Room not found"}), 404

        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]
        if not file.filename or not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Allowed: jpg, jpeg, png, webp"}), 400

        ext = secure_filename(file.filename).rsplit(".", 1)[1].lower()
        storage_path = f"rooms/{room_id}/baseline.{ext}"

        image_url = save_image_artifact(file, storage_path)
        database.set_baseline(room_id, image_url)
        cache.clear()

        return jsonify({"success": True, "image_path": image_url}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to upload baseline image: {e}"}), 500

@app.route("/api/scan", methods=["POST"])
@require_auth(allowed_roles=["admin", "manager", "inspector"])
def scan_image():
    try:
        room_id = request.form.get("room_id", "").strip()
        if not room_id:
            return jsonify({"error": "room_id is required"}), 400

        room = database.get_room(room_id)
        if not room:
            return jsonify({"error": "Room not found"}), 404

        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]
        if not file.filename or not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Allowed: jpg, jpeg, png, webp"}), 400

        ext = secure_filename(file.filename).rsplit(".", 1)[1].lower()
        timestamp = int(time.time())
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        try:
            prediction = model.predict(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        storage_path = f"rooms/{room_id}/scans/scan_{timestamp}.{ext}"
        image_url = save_image_artifact(file, storage_path)

        scan_id = database.add_scan(
            room_id=room_id,
            image_path=image_url,
            score=prediction["score"],
            status=prediction["status"],
            scanned_by=request.auth_user["uid"],
        )

        if prediction["status"] in ("dirty", "needs_attention"):
            status_label = "Dirty" if prediction["status"] == "dirty" else "Needs attention"
            room_name = room.get("name", f"Room {room_id}")
            database.create_notification(
                type_="scan_result",
                title=f"{status_label}: {room_name}",
                message=f"{room_name} scored {prediction['score']}/100.",
                room_id=room_id,
            )

        cache.clear()
        return jsonify({
            "scan_id": scan_id,
            "score": prediction["score"],
            "status": prediction["status"],
            "room_id": room_id,
            "image_path": image_url,
            "mock": prediction["mock"],
        }), 200
    except Exception as e:
        return jsonify({"error": f"Scan failed: {e}"}), 500

@app.route("/api/rooms/<room_id>/history", methods=["GET"])
@require_auth()
def get_history(room_id):
    try:
        limit = request.args.get("limit", 20, type=int)
        history = database.get_scan_history(room_id, limit)
        return jsonify({"history": history}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch history: {e}"}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "mock_mode": model.MOCK_MODE}), 200

@app.route("/api/rooms/<room_id>", methods=["DELETE"])
@require_auth(allowed_roles=["admin", "manager"])
def delete_room(room_id):
    try:
        deleted = database.delete_room(room_id)
        if deleted is None:
            return jsonify({"error": "Room not found"}), 404
        cache.clear()
        return "", 204
    except Exception as e:
        return jsonify({"error": f"Failed to delete room: {e}"}), 500

@app.route("/api/scans/<scan_id>", methods=["DELETE"])
@require_auth(allowed_roles=["admin", "manager"])
def delete_scan(scan_id):
    try:
        deleted = database.delete_scan(scan_id)
        if not deleted:
            return jsonify({"error": "Scan not found"}), 404
        cache.clear()
        return "", 204
    except Exception as e:
        return jsonify({"error": f"Failed to delete scan: {e}"}), 500

@app.route("/api/reports/summary", methods=["GET"])
@require_auth()
def reports_summary():
    try:
        days = request.args.get("days", default=7, type=int)
        summary = database.get_reports_summary(days=days)
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate report summary: {e}"}), 500

@app.route("/api/notifications", methods=["GET"])
@require_auth()
def get_notifications():
    try:
        limit = request.args.get("limit", 50, type=int)
        notifications = database.get_notifications(limit=limit)
        unread_count = database.get_unread_notification_count()
        return jsonify({"notifications": notifications, "unread_count": unread_count}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch notifications: {e}"}), 500

@app.route("/api/notifications/<notification_id>/read", methods=["PATCH"])
@require_auth()
def mark_notification_read(notification_id):
    try:
        updated = database.mark_notification_read(notification_id)
        if not updated:
            return jsonify({"error": "Notification not found"}), 404
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to mark notification: {e}"}), 500

@app.route("/api/notifications/mark-all-read", methods=["POST"])
@require_auth()
def mark_all_notifications_read():
    try:
        database.mark_all_notifications_read()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to mark notifications: {e}"}), 500

@app.route("/api/admin/stats", methods=["GET"])
@require_auth(allowed_roles=["admin", "manager"])
def admin_stats():
    try:
        stats = database.get_system_stats()
        stats["mock_mode"] = model.MOCK_MODE
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch stats: {e}"}), 500

@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    upload_folder = os.path.join(os.path.dirname(__file__), "uploads")
    safe_uploads = os.path.realpath(upload_folder)
    requested = os.path.realpath(os.path.join(upload_folder, filename))
    if not requested.startswith(safe_uploads + os.sep) and requested != safe_uploads:
        return jsonify({"error": "Forbidden"}), 403
    return send_from_directory(upload_folder, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug, threaded=True)