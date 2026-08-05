"""
CleanVision Firebase Admin SDK Configuration — Single-Hospital Model
Handles Firebase Admin initialization, token verification, custom claims (roles: admin, manager, inspector),
Firestore database access, and Storage bucket access.
"""

import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, auth, firestore, storage

_firebase_app = None
_db = None
_bucket = None

def init_firebase():
    global _firebase_app, _db, _bucket
    if _firebase_app is not None:
        return _firebase_app

    service_account_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()

    if not service_account_env:
        local_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
        if os.path.exists(local_path):
            cred = credentials.Certificate(local_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            print("[CleanVision Firebase Admin] Initialized from local serviceAccountKey.json")
        else:
            try:
                cred = credentials.ApplicationDefault()
                _firebase_app = firebase_admin.initialize_app(cred)
                print("[CleanVision Firebase Admin] Initialized from Application Default Credentials")
            except Exception as e:
                print(f"[CleanVision Firebase Admin Warning] Credentials not found ({e}). Local fallback mode active.")
                return None
    else:
        cred_dict = None
        try:
            cred_dict = json.loads(service_account_env)
        except Exception:
            try:
                decoded = base64.b64decode(service_account_env).decode("utf-8")
                cred_dict = json.loads(decoded)
            except Exception as e:
                print(f"[CleanVision Firebase Admin Error] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
                return None

        if cred_dict:
            cred = credentials.Certificate(cred_dict)
            _firebase_app = firebase_admin.initialize_app(cred)
            print("[CleanVision Firebase Admin] Initialized successfully from environment JSON")

    return _firebase_app

def get_db():
    global _db
    if _db is None:
        init_firebase()
        try:
            _db = firestore.client()
        except Exception as e:
            print(f"[CleanVision Firestore Error] {e}")
            _db = None
    return _db

def get_bucket():
    global _bucket
    if _bucket is None:
        init_firebase()
        try:
            _bucket = storage.bucket()
        except Exception as e:
            print(f"[CleanVision Storage Error] {e}")
            _bucket = None
    return _bucket

def verify_token(id_token: str) -> dict:
    init_firebase()
    if not id_token:
        raise ValueError("Missing ID token")
    return auth.verify_id_token(id_token)

def set_user_claims(uid: str, role: str, assigned_blocks: list = None):
    """
    Sets custom claims on a staff user.
    Roles: 'admin', 'manager', 'inspector'
    """
    init_firebase()
    claims = {
        "role": role,
        "assignedBlocks": assigned_blocks or [],
    }
    auth.set_custom_user_claims(uid, claims)

    db = get_db()
    if db:
        user_ref = db.collection("users").document(uid)
        user_ref.set({
            "role": role,
            "assignedBlocks": assigned_blocks or [],
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }, merge=True)

    return claims
