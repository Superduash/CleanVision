"""
Seed script for CleanVision demo data.
Run this script to populate the database with realistic demo data
including rooms across multiple blocks and 7 days of scans.
"""

import os
import random
from datetime import datetime, timedelta
import sqlite3
from database import DB_PATH, get_connection, add_room, add_scan, init_db

def seed_data(reset=True):
    # Initialize DB in case it doesn't exist
    init_db()

    if reset:
        print("Resetting database...")
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM scans")
            cursor.execute("DELETE FROM rooms")
            # Reset sqlite autoincrement
            cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('scans', 'rooms')")

    # Check if we already have rooms
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM rooms")
        count = cursor.fetchone()[0]
        if count > 0 and not reset:
            print(f"Database already has {count} rooms. Use reset=True to overwrite.")
            return

    print("Seeding rooms...")
    rooms = [
        {"name": "OR 1", "block": "A"},
        {"name": "OR 2", "block": "A"},
        {"name": "ICU 101", "block": "B"},
        {"name": "ICU 102", "block": "B"},
        {"name": "Ward 305", "block": "C"},
        {"name": "Ward 306", "block": "C"},
    ]

    room_ids = {}
    for r in rooms:
        room_id = add_room(r["name"], r["block"])
        room_ids[r["name"]] = room_id

    print("Seeding scans...")
    now = datetime.now()
    
    # We want varied scores: some mostly clean, some attention, one dirty.
    # OR 1: Consistently clean (8.0 - 9.8)
    # OR 2: Needs attention today (was clean, now 5.5)
    # ICU 101: Clean (7.5 - 9.0)
    # ICU 102: Dirty (2.0 - 3.5)
    # Ward 305: Attention (4.5 - 6.5)
    # Ward 306: Clean (7.0 - 8.5)

    room_profiles = {
        "OR 1": lambda: random.uniform(8.0, 9.8),
        "OR 2": lambda day_offset: random.uniform(5.0, 6.5) if day_offset == 0 else random.uniform(7.5, 9.5),
        "ICU 101": lambda: random.uniform(7.5, 9.0),
        "ICU 102": lambda: random.uniform(2.0, 3.5),
        "Ward 305": lambda: random.uniform(4.5, 6.5),
        "Ward 306": lambda: random.uniform(7.0, 8.5),
    }

    def get_status(score):
        if score >= 7: return 'clean'
        if score >= 4: return 'needs_attention'
        return 'dirty'

    scan_count = 0
    # Generate scans over the last 7 days (day 0 is today, day 6 is 6 days ago)
    for day_offset in range(7, -1, -1):
        scan_date = now - timedelta(days=day_offset)
        
        for room_name, room_id in room_ids.items():
            # Maybe skip a scan on some days for realism, but guarantee a scan today
            if day_offset != 0 and random.random() < 0.2:
                continue
                
            if room_name == "OR 2":
                score = room_profiles[room_name](day_offset)
            else:
                score = room_profiles[room_name]()
                
            status = get_status(score)
            
            # Vary the hour a bit
            scan_time = scan_date.replace(hour=random.randint(8, 18), minute=random.randint(0, 59))
            
            # Direct insert to allow custom timestamp
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    '''INSERT INTO scans (room_id, cleanliness_score, status, timestamp) 
                       VALUES (?, ?, ?, ?)''',
                    (room_id, round(score, 1), status, scan_time.strftime('%Y-%m-%d %H:%M:%S'))
                )
            scan_count += 1

    print(f"Successfully seeded {len(rooms)} rooms and {scan_count} scans.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Seed CleanVision database with demo data.')
    parser.add_argument('--no-reset', action='store_true', help='Do not clear existing data before seeding')
    args = parser.parse_args()
    
    seed_data(reset=not args.no_reset)
