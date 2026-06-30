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