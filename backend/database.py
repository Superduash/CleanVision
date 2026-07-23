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