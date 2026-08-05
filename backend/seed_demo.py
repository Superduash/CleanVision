"""
CleanVision Demo Accounts Seed Script
Seeds demo accounts for internship presentation:
 - admin@hospital.com (Admin)
 - manager@hospital.com (Manager)
 - inspector@hospital.com (Inspector assigned to Block A & Block B)
"""

import sys
from dotenv import load_dotenv

load_dotenv()

import firebase_config
from firebase_admin import auth, firestore

DEMO_ACCOUNTS = [
    {"email": "admin@hospital.com", "name": "Dr. Aris Thorne", "role": "admin", "blocks": []},
    {"email": "manager@hospital.com", "name": "Elena Rostova", "role": "manager", "blocks": []},
    {"email": "inspector@hospital.com", "name": "Marcus Vance", "role": "inspector", "blocks": ["Block A", "Block B"]},
]

def main():
    firebase_config.init_firebase()
    db = firebase_config.get_db()

    print("[CleanVision Demo Seed] Seeding demo staff accounts...")

    for acc in DEMO_ACCOUNTS:
        email = acc["email"]
        try:
            user = auth.get_user_by_email(email)
            print(f"Found existing demo user: {email} ({user.uid})")
        except auth.UserNotFoundError:
            user = auth.create_user(email=email, password="demo12345", display_name=acc["name"])
            print(f"Created demo user: {email} ({user.uid})")

        firebase_config.set_user_claims(user.uid, role=acc["role"], assigned_blocks=acc["blocks"])

        if db:
            user_ref = db.collection("users").document(user.uid)
            user_ref.set({
                "email": email,
                "name": acc["name"],
                "role": acc["role"],
                "assignedBlocks": acc["blocks"],
                "createdAt": firestore.SERVER_TIMESTAMP,
            }, merge=True)

    print("[SUCCESS] All demo accounts seeded successfully!")

if __name__ == "__main__":
    main()
