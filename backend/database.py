"""
CleanVision Database Module
SQLite database for rooms and scans management.
"""

import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')


@contextmanager
def get_connection():
    """Context manager for database connections with proper cleanup."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Creates tables if they don't exist, enables foreign keys."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                block TEXT,
                baseline_image_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id INTEGER NOT NULL,
                image_path TEXT,
                cleanliness_score REAL,
                status TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(room_id) REFERENCES rooms(id)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cleaning_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id INTEGER NOT NULL,
                requested_by_name TEXT,
                requested_by_email TEXT,
                reason TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT,
                room_id INTEGER,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE SET NULL
            )
        ''')


def add_room(name, block):
    """Inserts a new room and returns its id."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO rooms (name, block) VALUES (?, ?)',
            (name, block)
        )
        return cursor.lastrowid


def set_baseline(room_id, image_path):
    """Sets the baseline image path for a room."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE rooms SET baseline_image_path = ? WHERE id = ?',
            (image_path, room_id)
        )


def get_all_rooms():
    """
    Returns all rooms with latest_score, latest_status, last_scanned
    pulled via LEFT JOIN against the most recent scan per room.
    Rooms with no scans show null for these fields.
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                r.id,
                r.name,
                r.block,
                r.baseline_image_path,
                r.created_at,
                latest.score AS latest_score,
                latest.status AS latest_status,
                latest.timestamp AS last_scanned
            FROM rooms r
            LEFT JOIN (
                SELECT 
                    s1.room_id,
                    s1.cleanliness_score AS score,
                    s1.status,
                    s1.timestamp
                FROM scans s1
                INNER JOIN (
                    SELECT room_id, MAX(timestamp) AS max_ts
                    FROM scans
                    GROUP BY room_id
                ) s2 ON s1.room_id = s2.room_id AND s1.timestamp = s2.max_ts
            ) latest ON r.id = latest.room_id
            ORDER BY r.created_at DESC
        ''')
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_room(room_id):
    """Returns a single room by id, or None if not found."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM rooms WHERE id = ?', (room_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def add_scan(room_id, image_path, score, status):
    """Inserts a new scan and returns its id."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO scans (room_id, image_path, cleanliness_score, status) VALUES (?, ?, ?, ?)',
            (room_id, image_path, score, status)
        )
        return cursor.lastrowid


def get_scan_history(room_id, limit=10):
    """Returns the most recent scans for a room, most recent first."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT id, room_id, image_path, cleanliness_score, status, timestamp 
               FROM scans 
               WHERE room_id = ? 
               ORDER BY timestamp DESC 
               LIMIT ?''',
            (room_id, limit)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_scan(scan_id):
    """Returns a single scan by id, or None if not found."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM scans WHERE id = ?', (scan_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def delete_scan(scan_id):
    """Deletes a single scan record. Returns True if deleted, False if not found."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM scans WHERE id = ?', (scan_id,))
        return cursor.rowcount > 0


def delete_room(room_id):
    """
    Deletes a room and all its associated scans (manual cascade).
    Returns the list of image paths that should be cleaned up from disk.
    Returns None if the room was not found.
    """
    with get_connection() as conn:
        cursor = conn.cursor()

        # Check room exists
        cursor.execute('SELECT id FROM rooms WHERE id = ?', (room_id,))
        if not cursor.fetchone():
            return None

        # Collect all image paths for file cleanup
        image_paths = []

        # Room baseline image
        cursor.execute('SELECT baseline_image_path FROM rooms WHERE id = ?', (room_id,))
        row = cursor.fetchone()
        if row and row['baseline_image_path']:
            image_paths.append(row['baseline_image_path'])

        # Scan images
        cursor.execute('SELECT image_path FROM scans WHERE room_id = ?', (room_id,))
        for scan_row in cursor.fetchall():
            if scan_row['image_path']:
                image_paths.append(scan_row['image_path'])

        # Delete scans first (foreign key)
        cursor.execute('DELETE FROM scans WHERE room_id = ?', (room_id,))

        # Delete the room
        cursor.execute('DELETE FROM rooms WHERE id = ?', (room_id,))

        return image_paths


def update_room(room_id, name, block):
    """Updates a room's name and block. Returns True if updated, False if not found."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE rooms SET name = ?, block = ? WHERE id = ?',
            (name, block, room_id)
        )
        return cursor.rowcount > 0


# ── Cleaning Requests ──────────────────────────────────────────────────────────

def create_cleaning_request(room_id, requested_by_name, requested_by_email, reason=''):
    """Creates a new cleaning request and returns its id."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''INSERT INTO cleaning_requests
               (room_id, requested_by_name, requested_by_email, reason)
               VALUES (?, ?, ?, ?)''',
            (room_id, requested_by_name, requested_by_email, reason)
        )
        return cursor.lastrowid


def get_cleaning_requests(status_filter=None):
    """Returns all cleaning requests, optionally filtered by status."""
    with get_connection() as conn:
        cursor = conn.cursor()
        if status_filter:
            cursor.execute(
                '''SELECT cr.*, r.name as room_name, r.block as room_block
                   FROM cleaning_requests cr
                   JOIN rooms r ON cr.room_id = r.id
                   WHERE cr.status = ?
                   ORDER BY cr.created_at DESC''',
                (status_filter,)
            )
        else:
            cursor.execute(
                '''SELECT cr.*, r.name as room_name, r.block as room_block
                   FROM cleaning_requests cr
                   JOIN rooms r ON cr.room_id = r.id
                   ORDER BY cr.created_at DESC'''
            )
        return [dict(row) for row in cursor.fetchall()]


def get_room_cleaning_requests(room_id):
    """Returns cleaning requests for a specific room."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT * FROM cleaning_requests
               WHERE room_id = ?
               ORDER BY created_at DESC''',
            (room_id,)
        )
        return [dict(row) for row in cursor.fetchall()]


def update_cleaning_request_status(request_id, new_status):
    """Updates a cleaning request status. Returns True if updated."""
    from datetime import datetime
    resolved_at = datetime.utcnow().isoformat() if new_status in ('completed', 'dismissed') else None
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE cleaning_requests SET status = ?, resolved_at = ? WHERE id = ?',
            (new_status, resolved_at, request_id)
        )
        return cursor.rowcount > 0


def get_pending_request_count():
    """Returns count of pending cleaning requests."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM cleaning_requests WHERE status = 'pending'")
        return cursor.fetchone()['cnt']


# ── Notifications ──────────────────────────────────────────────────────────────

def create_notification(type_, title, message='', room_id=None):
    """Creates a new notification and returns its id."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO notifications (type, title, message, room_id) VALUES (?, ?, ?, ?)',
            (type_, title, message, room_id)
        )
        return cursor.lastrowid


def get_notifications(limit=50):
    """Returns notifications, most recent first."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?',
            (limit,)
        )
        return [dict(row) for row in cursor.fetchall()]


def mark_notification_read(notification_id):
    """Marks a single notification as read."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE notifications SET is_read = 1 WHERE id = ?',
            (notification_id,)
        )
        return cursor.rowcount > 0


def mark_all_notifications_read():
    """Marks all notifications as read."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE notifications SET is_read = 1')


def delete_notification(notification_id):
    """Deletes a notification."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM notifications WHERE id = ?', (notification_id,))
        return cursor.rowcount > 0


def get_unread_notification_count():
    """Returns count of unread notifications."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) as cnt FROM notifications WHERE is_read = 0')
        return cursor.fetchone()['cnt']


def get_system_stats():
    """Returns aggregate system statistics for the admin panel."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) as cnt FROM rooms')
        total_rooms = cursor.fetchone()['cnt']
        cursor.execute('SELECT COUNT(*) as cnt FROM scans')
        total_scans = cursor.fetchone()['cnt']
        cursor.execute("SELECT COUNT(*) as cnt FROM cleaning_requests WHERE status = 'pending'")
        pending_requests = cursor.fetchone()['cnt']
        cursor.execute("SELECT COUNT(*) as cnt FROM notifications WHERE is_read = 0")
        unread_notifications = cursor.fetchone()['cnt']
    return {
        'total_rooms': total_rooms,
        'total_scans': total_scans,
        'pending_requests': pending_requests,
        'unread_notifications': unread_notifications,
    }


def get_reports_summary(days=7):
    """
    Aggregate cleanliness stats for the Reports screen.
    Returns today_count, avg_score_today, status_counts (most recent scan per room),
    daily_trend (continuous x-axis), and block_breakdown.
    """
    from datetime import datetime, timedelta

    with get_connection() as conn:
        cursor = conn.cursor()

        # today_count + avg_score_today
        cursor.execute("""
            SELECT COUNT(*) as cnt,
                   COALESCE(ROUND(AVG(cleanliness_score), 1), 0) as avg
            FROM scans
            WHERE date(timestamp) = date('now')
        """)
        today = cursor.fetchone()
        today_count = today["cnt"]
        avg_score_today = today["avg"]

        # status_counts — most recent scan per room only
        cursor.execute("""
            SELECT
                SUM(CASE WHEN s.status = 'clean' THEN 1 ELSE 0 END) as clean,
                SUM(CASE WHEN s.status = 'needs_attention' THEN 1 ELSE 0 END) as needs_attention,
                SUM(CASE WHEN s.status = 'dirty' THEN 1 ELSE 0 END) as dirty
            FROM scans s
            INNER JOIN (
                SELECT room_id, MAX(timestamp) as max_ts
                FROM scans GROUP BY room_id
            ) latest ON s.room_id = latest.room_id AND s.timestamp = latest.max_ts
        """)
        sc = cursor.fetchone()
        status_counts = {
            "clean": sc["clean"] or 0,
            "needs_attention": sc["needs_attention"] or 0,
            "dirty": sc["dirty"] or 0,
        }

        # daily_trend — continuous, fill missing days with 0
        today_date = datetime.now().date()
        trend_dates = [
            (today_date - timedelta(days=i)).isoformat()
            for i in range(days - 1, -1, -1)
        ]

        cursor.execute("""
            SELECT date(timestamp) as d,
                   ROUND(AVG(cleanliness_score), 1) as avg_score,
                   COUNT(*) as scan_count
            FROM scans
            WHERE date(timestamp) >= date('now', ?)
            GROUP BY date(timestamp)
            ORDER BY date(timestamp) ASC
        """, (f"-{days} days",))
        trend_rows = {
            row["d"]: {"avg_score": row["avg_score"], "scan_count": row["scan_count"]}
            for row in cursor.fetchall()
        }
        daily_trend = [
            {
                "date": d,
                "avg_score": trend_rows.get(d, {}).get("avg_score", 0),
                "scan_count": trend_rows.get(d, {}).get("scan_count", 0),
            }
            for d in trend_dates
        ]

        # block_breakdown — each room's latest scan, grouped by block
        cursor.execute("""
            SELECT
                r.block,
                COUNT(DISTINCT r.id) as room_count,
                ROUND(AVG(s.cleanliness_score), 1) as avg_score,
                SUM(CASE WHEN s.status IN ('needs_attention', 'dirty')
                    THEN 1 ELSE 0 END) as attention_count
            FROM rooms r
            LEFT JOIN (
                SELECT s1.room_id, s1.cleanliness_score, s1.status
                FROM scans s1
                INNER JOIN (
                    SELECT room_id, MAX(timestamp) as max_ts
                    FROM scans GROUP BY room_id
                ) s2 ON s1.room_id = s2.room_id AND s1.timestamp = s2.max_ts
            ) s ON r.id = s.room_id
            GROUP BY r.block
            ORDER BY r.block ASC
        """)
        block_breakdown = [dict(row) for row in cursor.fetchall()]

    return {
        "today_count": today_count,
        "avg_score_today": avg_score_today,
        "status_counts": status_counts,
        "daily_trend": daily_trend,
        "block_breakdown": block_breakdown,
    }