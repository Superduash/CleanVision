"""
CleanVision Bootstrap Admin Seed Script — Single-Hospital Architecture
Grants Admin custom claims via Firebase Admin SDK.
Usage:
  python seed_admin.py [--email admin@hospital.com]
"""

import sys
import argparse
import os
from dotenv import load_dotenv

load_dotenv()

import firebase_config
from firebase_admin import auth, firestore

def main():
    parser = argparse.ArgumentParser(description="Bootstrap CleanVision Initial Admin User")
    parser.add_argument("--email", type=str, help="Email address of the initial admin user")
    args = parser.parse_args()

    email = args.email or os.environ.get("INITIAL_ADMIN_EMAIL", "").strip() or "admin@hospital.com"

    firebase_config.init_firebase()

    try:
        user = auth.get_user_by_email(email)
        print(f"[CleanVision Seed Admin] Found existing user: {user.uid} ({user.email})")
    except auth.UserNotFoundError:
        print(f"[CleanVision Seed Admin] Creating user {email} in Firebase Auth...")
        user = auth.create_user(email=email, password="adminpassword123", display_name="System Admin")
    except Exception as e:
        print(f"[ERROR] Failed to fetch user from Firebase Auth: {e}")
        sys.exit(1)

    firebase_config.set_user_claims(user.uid, role="admin", assigned_blocks=[])

    db = firebase_config.get_db()
    if db:
        user_ref = db.collection("users").document(user.uid)
        user_ref.set({
            "email": email,
            "name": user.display_name or "System Admin",
            "role": "admin",
            "assignedBlocks": [],
            "createdAt": firestore.SERVER_TIMESTAMP,
        }, merge=True)

    print(f"[SUCCESS] Admin custom claims successfully granted to {email} ({user.uid})!")

if __name__ == "__main__":
    main()
