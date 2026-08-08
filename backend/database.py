"""
CleanVision Database Module — Single-Hospital Architecture
Firestore-backed data access layer for Hospital Config, Public Room Lookup,
Public Issue Reporting, Rooms, Scans, and Staff Roster.
"""

import os
import json
import time
import uuid
from datetime import datetime, timedelta
import firebase_config

LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "local_db.json")

# Local fallback store if Firestore credentials are missing in local dev
_in_memory_store = {
    "hospitalConfig": {
        "main": {
            "hospitalName": "City General Hospital",
            "hospitalCode": "CGH",
            "blocks": ["Block A", "Block B", "Block C", "Block D"],
            "supportEmail": "support@cleanvision.com",
            "logoUrl": None,
            "updatedAt": datetime.utcnow().isoformat(),
        }
    },
    "roomLookup": {},
    "users": {},
    "rooms": {},
    "scans": {},
    "issueReports": {},
    "notifications": {}
}

def _save_local_store():
    try:
        with open(LOCAL_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(_in_memory_store, f, indent=2)
    except Exception as e:
        print(f"[CleanVision Local DB Error] Failed to save store: {e}")

def _load_local_store():
    global _in_memory_store
    if os.path.exists(LOCAL_DB_PATH):
        try:
            with open(LOCAL_DB_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                _in_memory_store.update(data)
                print(f"[CleanVision Local DB] Loaded {len(_in_memory_store.get('rooms', {}))} rooms from local_db.json.")
                return
        except Exception as e:
            print(f"[CleanVision Local DB Error] Failed to load local_db.json: {e}")

    # Seed initial demo rooms if file does not exist
    print("[CleanVision Local DB] Seeding default demo rooms into local database...")
    demo_rooms = [
        {"name": "Emergency Ward 101", "block": "Block A", "floor": "Floor 1", "num": "101", "code": "CGH-A-101-A"},
        {"name": "ICU Ward 2204", "block": "Block B", "floor": "Floor 2", "num": "2204", "code": "CGH-B-2204-B1"},
        {"name": "General Surgery 302", "block": "Block C", "floor": "Floor 3", "num": "302", "code": "CGH-C-302-C"},
    ]
    for r in demo_rooms:
        r_id = str(uuid.uuid4())
        room_data = {
            "id": r_id,
            "name": r["name"],
            "block": r["block"],
            "floor": r["floor"],
            "roomNumber": r["num"],
            "roomCode": r["code"],
            "baselineImagePath": None,
            "createdAt": datetime.utcnow().isoformat(),
            "createdBy": "demo-seed",
        }
        lookup_data = {
            "roomCode": r["code"],
            "roomId": r_id,
            "block": r["block"],
            "floor": r["floor"],
            "roomNumber": r["num"],
            "hospitalName": "City General Hospital",
        }
        _in_memory_store["rooms"][r_id] = room_data
        _in_memory_store["roomLookup"][r["code"]] = lookup_data

    _save_local_store()

def _get_db():
    """Return Firestore client, or None in local fallback mode."""
    return firebase_config.get_db()

def init_db():
    """Firestore initialization."""
    db = _get_db()
    if db:
        print("[CleanVision Database] Firestore connected (Single-Hospital Mode).")
    else:
        _load_local_store()
        print("[CleanVision Database] Firestore client unavailable — using persistent local JSON database.")

# ─────────────────────────────────────────────────────────────────────────────
# Hospital Config (Singleton: hospitalConfig/main)
# ─────────────────────────────────────────────────────────────────────────────

def get_hospital_config() -> dict:
    db = _get_db()
    if db:
        doc = db.collection("hospitalConfig").document("main").get()
        if doc.exists:
            return doc.to_dict()
    return _in_memory_store["hospitalConfig"]["main"]

def update_hospital_config(config_data: dict, updated_by: str = "admin") -> dict:
    db = _get_db()
    config_data["updatedAt"] = datetime.utcnow().isoformat()
    config_data["updatedBy"] = updated_by

    if db:
        db.collection("hospitalConfig").document("main").set(config_data, merge=True)
    else:
        _in_memory_store["hospitalConfig"]["main"].update(config_data)

    return get_hospital_config()

# ─────────────────────────────────────────────────────────────────────────────
# Rooms & Public Room Lookup (roomLookup/{roomCode})
# ─────────────────────────────────────────────────────────────────────────────

def add_room(name: str, block: str, floor: str = "Floor 1", room_number: str = None, created_by: str = None) -> tuple:
    db = _get_db()
    room_id = str(uuid.uuid4())
    config = get_hospital_config()
    code_prefix = config.get("hospitalCode", "CGH")
    
    clean_block = block.replace(" ", "")
    num = room_number or "".join([c for c in name if c.isdigit()]) or "101"
    room_code = f"{code_prefix}-{clean_block}-{num}-A"

    room_data = {
        "id": room_id,
        "name": name,
        "block": block,
        "floor": floor,
        "roomNumber": num,
        "roomCode": room_code,
        "baselineImagePath": None,
        "createdAt": datetime.utcnow().isoformat(),
        "createdBy": created_by,
    }

    lookup_data = {
        "roomCode": room_code,
        "roomId": room_id,
        "block": block,
        "floor": floor,
        "roomNumber": num,
        "hospitalName": config.get("hospitalName", "City General Hospital"),
    }

    if db:
        db.collection("rooms").document(room_id).set(room_data)
        db.collection("roomLookup").document(room_code).set(lookup_data)
    else:
        _in_memory_store["rooms"][room_id] = room_data
        _in_memory_store["roomLookup"][room_code] = lookup_data
        _save_local_store()

    return room_id, room_code

def get_room_lookup(room_code: str) -> dict:
    db = _get_db()
    if db:
        doc = db.collection("roomLookup").document(room_code).get()
        if doc.exists:
            return doc.to_dict()
    return _in_memory_store["roomLookup"].get(room_code)

def set_baseline(room_id: str, image_path: str):
    db = _get_db()
    r_id = str(room_id)
    if db:
        db.collection("rooms").document(r_id).update({"baselineImagePath": image_path})
    else:
        if r_id in _in_memory_store["rooms"]:
            _in_memory_store["rooms"][r_id]["baselineImagePath"] = image_path

def get_all_rooms(block_filter: str = None) -> list:
    db = _get_db()
    rooms_list = []

    if db:
        query = db.collection("rooms")
        if block_filter:
            query = query.where("block", "==", block_filter)
        room_docs = [d.to_dict() for d in query.stream()]

        for room in room_docs:
            r_id = room.get("id")
            scans_query = db.collection("scans").where("roomId", "==", r_id).order_by("timestamp", direction="DESCENDING").limit(1).stream()
            scans = [s.to_dict() for s in scans_query]
            if scans:
                latest = scans[0]
                room["latest_score"] = latest.get("cleanlinessScore")
                room["latest_status"] = latest.get("status")
                room["last_scanned"] = latest.get("timestamp")
            else:
                room["latest_score"] = None
                room["latest_status"] = None
                room["last_scanned"] = None
            rooms_list.append(room)
    else:
        rooms = list(_in_memory_store["rooms"].values())
        if block_filter:
            rooms = [r for r in rooms if r.get("block") == block_filter]

        for room in rooms:
            r_id = room.get("id")
            r_scans = [s for s in _in_memory_store["scans"].values() if s.get("roomId") == r_id]
            r_scans.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            if r_scans:
                latest = r_scans[0]
                room["latest_score"] = latest.get("cleanlinessScore")
                room["latest_status"] = latest.get("status")
                room["last_scanned"] = latest.get("timestamp")
            else:
                room["latest_score"] = None
                room["latest_status"] = None
                room["last_scanned"] = None
            rooms_list.append(room)

    return rooms_list

def get_room(room_id: str) -> dict:
    db = _get_db()
    r_id = str(room_id)
    if db:
        doc = db.collection("rooms").document(r_id).get()
        return doc.to_dict() if doc.exists else None
    return _in_memory_store["rooms"].get(r_id)

def update_room(room_id: str, name: str, block: str, floor: str = None, room_number: str = None) -> bool:
    db = _get_db()
    r_id = str(room_id)
    if db:
        ref = db.collection("rooms").document(r_id)
        if not ref.get().exists:
            return False
        update_data = {"name": name, "block": block}
        if floor: update_data["floor"] = floor
        if room_number: update_data["roomNumber"] = room_number
        ref.update(update_data)
        return True
    else:
        if r_id in _in_memory_store["rooms"]:
            _in_memory_store["rooms"][r_id]["name"] = name
            _in_memory_store["rooms"][r_id]["block"] = block
            if floor: _in_memory_store["rooms"][r_id]["floor"] = floor
            if room_number: _in_memory_store["rooms"][r_id]["roomNumber"] = room_number
            return True
        return False

def delete_room(room_id: str) -> list:
    db = _get_db()
    r_id = str(room_id)
    image_paths = []

    room = get_room(r_id)
    if not room:
        return None

    if room.get("baselineImagePath"):
        image_paths.append(room["baselineImagePath"])

    if db:
        scans = db.collection("scans").where("roomId", "==", r_id).stream()
        for s in scans:
            s_dict = s.to_dict()
            if s_dict.get("imagePath"):
                image_paths.append(s_dict["imagePath"])
            db.collection("scans").document(s.id).delete()

        db.collection("rooms").document(r_id).delete()
        if room.get("roomCode"):
            db.collection("roomLookup").document(room["roomCode"]).delete()
    else:
        _in_memory_store["rooms"].pop(r_id, None)
        if room.get("roomCode"):
            _in_memory_store["roomLookup"].pop(room["roomCode"], None)
        scan_ids = [sid for sid, s in _in_memory_store["scans"].items() if s.get("roomId") == r_id]
        for sid in scan_ids:
            s = _in_memory_store["scans"].pop(sid)
            if s.get("imagePath"):
                image_paths.append(s["imagePath"])

    return image_paths

# ─────────────────────────────────────────────────────────────────────────────
# Scans
# ─────────────────────────────────────────────────────────────────────────────

def add_scan(room_id: str, image_path: str, score: float, status: str, scanned_by: str = None) -> str:
    db = _get_db()
    scan_id = str(uuid.uuid4())
    scan_data = {
        "id": scan_id,
        "roomId": str(room_id),
        "imagePath": image_path,
        "cleanlinessScore": score,
        "status": status,
        "scannedBy": scanned_by,
        "timestamp": datetime.utcnow().isoformat(),
    }
    if db:
        db.collection("scans").document(scan_id).set(scan_data)
    else:
        _in_memory_store["scans"][scan_id] = scan_data
    return scan_id

def get_scan_history(room_id: str, limit: int = 20) -> list:
    db = _get_db()
    r_id = str(room_id)
    if db:
        query = db.collection("scans").where("roomId", "==", r_id).order_by("timestamp", direction="DESCENDING").limit(limit)
        return [doc.to_dict() for doc in query.stream()]
    else:
        scans = [s for s in _in_memory_store["scans"].values() if s.get("roomId") == r_id]
        scans.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return scans[:limit]

def get_scan(scan_id: str) -> dict:
    db = _get_db()
    s_id = str(scan_id)
    if db:
        doc = db.collection("scans").document(s_id).get()
        return doc.to_dict() if doc.exists else None
    return _in_memory_store["scans"].get(s_id)

def delete_scan(scan_id: str) -> bool:
    db = _get_db()
    s_id = str(scan_id)
    if db:
        ref = db.collection("scans").document(s_id)
        if not ref.get().exists:
            return False
        ref.delete()
        return True
    else:
        return _in_memory_store["scans"].pop(s_id, None) is not None

# ─────────────────────────────────────────────────────────────────────────────
# Public Issue Reports (issueReports/{reportId})
# ─────────────────────────────────────────────────────────────────────────────

def create_issue_report(room_code: str, issue_type: str, comment: str = None, photo_url: str = None) -> str:
    db = _get_db()
    report_id = str(uuid.uuid4())

    lookup = get_room_lookup(room_code)
    room_id = lookup.get("roomId") if lookup else "unknown-room"
    block = lookup.get("block") if lookup else "Block B"

    report_data = {
        "id": report_id,
        "roomCode": room_code,
        "roomId": room_id,
        "block": block,
        "issueType": issue_type,
        "comment": comment,
        "photoUrl": photo_url,
        "status": "open",
        "createdAt": datetime.utcnow().isoformat(),
        "resolvedBy": None,
        "resolvedAt": None,
    }

    if db:
        db.collection("issueReports").document(report_id).set(report_data)
    else:
        _in_memory_store["issueReports"][report_id] = report_data

    return report_id

def get_issue_reports(status_filter: str = None, block_filter: str = None) -> list:
    db = _get_db()
    reports_list = []

    if db:
        query = db.collection("issueReports")
        if status_filter:
            query = query.where("status", "==", status_filter)
        if block_filter:
            query = query.where("block", "==", block_filter)

        raw = [doc.to_dict() for doc in query.stream()]
        for r in raw:
            room = get_room(r.get("roomId"))
            if room:
                r["roomName"] = room.get("name")
            reports_list.append(r)
    else:
        raw = list(_in_memory_store["issueReports"].values())
        if status_filter:
            raw = [r for r in raw if r.get("status") == status_filter]
        if block_filter:
            raw = [r for r in raw if r.get("block") == block_filter]

        for r in raw:
            room = get_room(r.get("roomId"))
            if room:
                r["roomName"] = room.get("name")
            reports_list.append(r)

    reports_list.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return reports_list

def update_issue_report_status(report_id: str, new_status: str, resolved_by: str = None) -> bool:
    db = _get_db()
    rep_id = str(report_id)
    resolved_at = datetime.utcnow().isoformat() if new_status == "resolved" else None

    if db:
        ref = db.collection("issueReports").document(rep_id)
        if not ref.get().exists:
            return False
        ref.update({
            "status": new_status,
            "resolvedBy": resolved_by,
            "resolvedAt": resolved_at,
        })
        return True
    else:
        if rep_id in _in_memory_store["issueReports"]:
            _in_memory_store["issueReports"][rep_id]["status"] = new_status
            _in_memory_store["issueReports"][rep_id]["resolvedBy"] = resolved_by
            _in_memory_store["issueReports"][rep_id]["resolvedAt"] = resolved_at
            return True
        return False

# ─────────────────────────────────────────────────────────────────────────────
# Notifications & Staff
# ─────────────────────────────────────────────────────────────────────────────

def create_notification(type_: str, title: str, message: str = "", room_id: str = None) -> str:
    db = _get_db()
    n_id = str(uuid.uuid4())
    n_data = {
        "id": n_id,
        "type": type_,
        "title": title,
        "message": message,
        "roomId": str(room_id) if room_id else None,
        "is_read": False,
        "createdAt": datetime.utcnow().isoformat(),
    }
    if db:
        db.collection("notifications").document(n_id).set(n_data)
    else:
        _in_memory_store["notifications"][n_id] = n_data
    return n_id

def get_notifications(limit: int = 50) -> list:
    db = _get_db()
    if db:
        query = db.collection("notifications").order_by("createdAt", direction="DESCENDING").limit(limit)
        return [doc.to_dict() for doc in query.stream()]
    else:
        items = list(_in_memory_store["notifications"].values())
        items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return items[:limit]

def mark_notification_read(notification_id: str) -> bool:
    db = _get_db()
    n_id = str(notification_id)
    if db:
        ref = db.collection("notifications").document(n_id)
        if not ref.get().exists:
            return False
        ref.update({"is_read": True})
        return True
    else:
        if n_id in _in_memory_store["notifications"]:
            _in_memory_store["notifications"][n_id]["is_read"] = True
            return True
        return False

def mark_all_notifications_read():
    db = _get_db()
    if db:
        for doc in db.collection("notifications").where("is_read", "==", False).stream():
            doc.reference.update({"is_read": True})
    else:
        for n in _in_memory_store["notifications"].values():
            n["is_read"] = True

def delete_notification(notification_id: str) -> bool:
    db = _get_db()
    n_id = str(notification_id)
    if db:
        ref = db.collection("notifications").document(n_id)
        if not ref.get().exists:
            return False
        ref.delete()
        return True
    else:
        return _in_memory_store["notifications"].pop(n_id, None) is not None

def get_unread_notification_count() -> int:
    notes = get_notifications(limit=200)
    return len([n for n in notes if not n.get("is_read")])

def get_staff_users() -> list:
    db = _get_db()
    if db:
        return [doc.to_dict() for doc in db.collection("users").stream()]
    return list(_in_memory_store["users"].values())

def get_system_stats() -> dict:
    rooms = get_all_rooms()
    open_issues = len(get_issue_reports(status_filter="open"))
    unreads = get_unread_notification_count()

    db = _get_db()
    scans_count = len(list(db.collection("scans").stream())) if db else len(_in_memory_store["scans"])

    return {
        "total_rooms": len(rooms),
        "total_scans": scans_count,
        "pending_requests": open_issues,
        "open_issues": open_issues,
        "unread_notifications": unreads,
    }

def get_reports_summary(days: int = 7) -> dict:
    rooms = get_all_rooms()

    clean_cnt = len([r for r in rooms if r.get("latest_status") == "clean"])
    needs_att_cnt = len([r for r in rooms if r.get("latest_status") == "needs_attention"])
    dirty_cnt = len([r for r in rooms if r.get("latest_status") == "dirty"])

    scores = [r["latest_score"] for r in rooms if r.get("latest_score") is not None]
    avg_today = round(sum(scores) / len(scores), 1) if scores else 0.0

    blocks = {}
    for r in rooms:
        b = r.get("block", "Default")
        if b not in blocks:
            blocks[b] = {"block": b, "room_count": 0, "scores": [], "attention_count": 0}
        blocks[b]["room_count"] += 1
        if r.get("latest_score") is not None:
            blocks[b]["scores"].append(r["latest_score"])
        if r.get("latest_status") in ("needs_attention", "dirty"):
            blocks[b]["attention_count"] += 1

    block_breakdown = []
    for b_name, b_info in blocks.items():
        avg = round(sum(b_info["scores"]) / len(b_info["scores"]), 1) if b_info["scores"] else 0.0
        block_breakdown.append({
            "block": b_name,
            "room_count": b_info["room_count"],
            "avg_score": avg,
            "attention_count": b_info["attention_count"],
        })

    today_date = datetime.now().date()
    daily_trend = [
        {
            "date": (today_date - timedelta(days=i)).isoformat(),
            "avg_score": avg_today,
            "scan_count": len(scores),
        }
        for i in range(days - 1, -1, -1)
    ]

    return {
        "today_count": len(scores),
        "avg_score_today": avg_today,
        "status_counts": {
            "clean": clean_cnt,
            "needs_attention": needs_att_cnt,
            "dirty": dirty_cnt,
        },
        "daily_trend": daily_trend,
        "block_breakdown": block_breakdown,
    }