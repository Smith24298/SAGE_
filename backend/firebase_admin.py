"""
Firebase Admin SDK – initialize from a single service account JSON path.
Set FIREBASE_ADMIN_SDK_PATH in .env to the path to your service account key file.
"""
import os
from typing import Optional

_firebase_app = None


def _resolve_credentials_path(path: str) -> str:
    """Resolve credentials path across different working directories.

    - If `path` is absolute, return as-is.
    - If relative, first try relative to this backend package folder.
    - Otherwise fall back to the original relative path (relative to CWD).
    """

    if not path:
        return path
    if os.path.isabs(path):
        return path

    backend_dir = os.path.dirname(__file__)
    candidate = os.path.normpath(os.path.join(backend_dir, path))
    if os.path.isfile(candidate):
        return candidate

    return path


def get_firebase_app():
    """Return the initialized Firebase Admin app, or None if not configured."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    raw_path = os.getenv("FIREBASE_ADMIN_SDK_PATH") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not raw_path:
        return None

    path = _resolve_credentials_path(raw_path)
    if not os.path.isfile(path):
        return None

    import firebase_admin
    from firebase_admin import credentials

    cred = credentials.Certificate(path)
    _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


def get_firestore_client():
    """Return Firestore client from Admin SDK, or None if Firebase not configured."""
    app = get_firebase_app()
    if app is None:
        return None
    from firebase_admin import firestore
    return firestore.client()


def verify_id_token(id_token: str):
    """Verify a Firebase ID token (e.g. from frontend). Returns decoded claims or raises."""
    app = get_firebase_app()
    if app is None:
        raise RuntimeError("Firebase Admin not configured: set FIREBASE_ADMIN_SDK_PATH")
    from firebase_admin import auth
    return auth.verify_id_token(id_token)
