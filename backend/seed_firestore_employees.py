"""CLI wrapper to seed Firestore employee collections.

Usage (from repo root):
  python -m backend.seed_firestore_employees --dry-run
  python -m backend.seed_firestore_employees --count 200

Requires FIREBASE_ADMIN_SDK_PATH (or GOOGLE_APPLICATION_CREDENTIALS) to be set.
"""

from backend.firestore_seed import main


if __name__ == "__main__":
    raise SystemExit(main())
