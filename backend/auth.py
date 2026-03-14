import base64
import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
from bson import ObjectId
from pymongo import ReturnDocument

from backend.database import db

ALLOWED_ROLES = {"chro", "hrbp", "talent_ops", "recruiter"}
LEGACY_ROLE_MAP = {
    "hr_partner": "hrbp",
    "engagement_manager": "recruiter",
}

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-please-rotate-32b")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "720"))

_PASSWORD_SCHEME = "pbkdf2_sha256"
_PASSWORD_ITERATIONS = 390000

_MEM_USERS: dict[str, dict[str, Any]] = {}


def normalize_role(role: Any) -> Optional[str]:
    if role is None:
        return None
    role_value = str(role).strip().lower()
    if role_value in LEGACY_ROLE_MAP:
        return LEGACY_ROLE_MAP[role_value]
    if role_value in ALLOWED_ROLES:
        return role_value
    return None


def _default_assigned_employee_ids(role: Optional[str]) -> list[str]:
    return ["1", "3", "6"] if role == "hrbp" else []


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _users_collection():
    if db is None:
        return None
    return db["auth_users"]


def _password_hash(password: str, salt: bytes | None = None) -> str:
    actual_salt = salt or secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), actual_salt, _PASSWORD_ITERATIONS)
    salt_enc = base64.urlsafe_b64encode(actual_salt).decode("utf-8")
    hash_enc = base64.urlsafe_b64encode(key).decode("utf-8")
    return f"{_PASSWORD_SCHEME}${_PASSWORD_ITERATIONS}${salt_enc}${hash_enc}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        scheme, iterations, salt_enc, hash_enc = stored_hash.split("$", 3)
        if scheme != _PASSWORD_SCHEME:
            return False
        salt = base64.urlsafe_b64decode(salt_enc.encode("utf-8"))
        expected_hash = base64.urlsafe_b64decode(hash_enc.encode("utf-8"))
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations))
        return hmac.compare_digest(candidate, expected_hash)
    except Exception:
        return False


def _sanitize_user(doc: dict[str, Any]) -> dict[str, Any]:
    role = normalize_role(doc.get("role"))
    assigned = doc.get("assigned_employee_ids")
    if not isinstance(assigned, list):
        assigned = _default_assigned_employee_ids(role)

    return {
        "id": str(doc.get("_id", doc.get("id", ""))),
        "name": str(doc.get("name") or "User"),
        "email": str(doc.get("email") or ""),
        "role": role,
        "assignedEmployeeIds": [str(x) for x in assigned],
    }


def _find_user_doc_by_email(email: str) -> Optional[dict[str, Any]]:
    email_lc = email.strip().lower()
    collection = _users_collection()

    if collection is not None:
        return collection.find_one({"email_lc": email_lc})

    return _MEM_USERS.get(email_lc)


def _find_user_doc_by_id(user_id: str) -> Optional[dict[str, Any]]:
    collection = _users_collection()
    if collection is not None:
        if ObjectId.is_valid(user_id):
            by_object_id = collection.find_one({"_id": ObjectId(user_id)})
            if by_object_id:
                return by_object_id
        return collection.find_one({"_id": user_id})

    for user_doc in _MEM_USERS.values():
        if str(user_doc.get("_id")) == str(user_id):
            return user_doc
    return None


def create_user(name: str, email: str, password: str, role: str) -> dict[str, Any]:
    if not name or not name.strip():
        raise ValueError("Name is required")
    if not email or "@" not in email:
        raise ValueError("A valid email is required")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")

    normalized_role = normalize_role(role)
    if normalized_role is None:
        raise ValueError("Invalid role")

    existing = _find_user_doc_by_email(email)
    if existing is not None:
        raise ValueError("An account with this email already exists")

    now = _utc_now().isoformat()
    new_doc: dict[str, Any] = {
        "name": name.strip(),
        "email": email.strip(),
        "email_lc": email.strip().lower(),
        "password_hash": _password_hash(password),
        "role": normalized_role,
        "assigned_employee_ids": _default_assigned_employee_ids(normalized_role),
        "created_at": now,
        "updated_at": now,
    }

    collection = _users_collection()
    if collection is not None:
        result = collection.insert_one(new_doc)
        inserted = collection.find_one({"_id": result.inserted_id})
        if inserted is None:
            raise RuntimeError("Failed to create account")
        return _sanitize_user(inserted)

    mem_id = str(uuid.uuid4())
    new_doc["_id"] = mem_id
    _MEM_USERS[new_doc["email_lc"]] = new_doc
    return _sanitize_user(new_doc)


def authenticate_user(email: str, password: str) -> Optional[dict[str, Any]]:
    user_doc = _find_user_doc_by_email(email)
    if user_doc is None:
        return None

    stored_hash = str(user_doc.get("password_hash") or "")
    if not stored_hash or not _verify_password(password, stored_hash):
        return None

    return _sanitize_user(user_doc)


def update_user_role(user_id: str, role: str) -> dict[str, Any]:
    normalized_role = normalize_role(role)
    if normalized_role is None:
        raise ValueError("Invalid role")

    collection = _users_collection()
    assigned_employee_ids = _default_assigned_employee_ids(normalized_role)

    if collection is not None:
        selector: dict[str, Any]
        if ObjectId.is_valid(user_id):
            selector = {"_id": ObjectId(user_id)}
        else:
            selector = {"_id": user_id}

        result = collection.find_one_and_update(
            selector,
            {
                "$set": {
                    "role": normalized_role,
                    "assigned_employee_ids": assigned_employee_ids,
                    "updated_at": _utc_now().isoformat(),
                }
            },
            return_document=ReturnDocument.AFTER,
        )

        if result is None:
            raise ValueError("User not found")
        return _sanitize_user(result)

    user_doc = _find_user_doc_by_id(user_id)
    if user_doc is None:
        raise ValueError("User not found")

    user_doc["role"] = normalized_role
    user_doc["assigned_employee_ids"] = assigned_employee_ids
    user_doc["updated_at"] = _utc_now().isoformat()
    return _sanitize_user(user_doc)


def create_access_token(user: dict[str, Any], expires_minutes: Optional[int] = None) -> str:
    now = _utc_now()
    exp_minutes = expires_minutes if expires_minutes is not None else JWT_EXPIRE_MINUTES
    payload = {
        "sub": user["id"],
        "name": user.get("name", "User"),
        "email": user.get("email", ""),
        "role": normalize_role(user.get("role")),
        "assignedEmployeeIds": user.get("assignedEmployeeIds", []),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=exp_minutes)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    payload["role"] = normalize_role(payload.get("role"))
    if not isinstance(payload.get("assignedEmployeeIds"), list):
        payload["assignedEmployeeIds"] = _default_assigned_employee_ids(payload.get("role"))
    return payload
