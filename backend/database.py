from pymongo import MongoClient
import os
import ssl
import certifi

from pymongo.errors import CollectionInvalid

# MongoDB Atlas connection configuration
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    print("✗ MONGO_URI environment variable not set")
    client = None
    db = None
    employees = None
else:
    try:
        # MongoDB Atlas requires SSL/TLS
        # Use certifi to get CA bundle for certificate verification
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            retryWrites=True,
            tlsCaFile=certifi.where()  # Use certifi's CA bundle for MongoDB Atlas
        )
        # Test the connection
        client.admin.command('ping')
        print("✓ MongoDB Atlas connection successful")
        db = client["hr_ai"]
        employees = db["digital_twins"]
    except Exception as e:
        print(f"✗ MongoDB Atlas connection failed: {e}")
        print("Debug: Ensure MONGO_URI is correct and includes retryWrites=true")
        client = None
        db = None
        employees = None


def ensure_mongo_collections() -> dict:
    """Ensure key MongoDB collections/indexes exist.

    MongoDB creates collections on first insert, but creating them explicitly helps
    avoid surprises and makes dashboards work out-of-the-box.
    """

    if db is None:
        return {"ok": False, "reason": "Database connection not available"}

    required = {
        # Existing app collections
        "digital_twins": [
            {"keys": [("name", 1)], "unique": False},
        ],
        "employee_profiles": [
            {"keys": [("id", 1)], "unique": True},
            {"keys": [("employeeId", 1)], "unique": False},
            {"keys": [("department", 1)], "unique": False},
        ],
        "employee_insights": [
            {"keys": [("employeeId", 1)], "unique": True},
            {"keys": [("risk", 1)], "unique": False},
            {"keys": [("sentiment", -1)], "unique": False},
        ],
        "meeting_summaries": [
            {"keys": [("created_at", -1)], "unique": False},
        ],
        "dashboard_events": [
            {"keys": [("session_id", 1), ("date", 1), ("time", 1)], "unique": False},
            {"keys": [("created_at", -1)], "unique": False},
        ],
        # New/optional collections for engagement manager workflows
        "action_items": [
            {"keys": [("status", 1), ("dueDate", 1)], "unique": False},
        ],
        "pulse_surveys": [
            {"keys": [("createdAt", -1)], "unique": False},
            {"keys": [("employeeId", 1)], "unique": False},
        ],
        "workforce_kpis": [
            {"keys": [("_id", 1)], "unique": True},
        ],
    }

    existing = set(db.list_collection_names())
    created: list[str] = []
    indexes_created: list[str] = []

    for name, index_specs in required.items():
        if name not in existing:
            try:
                db.create_collection(name)
                created.append(name)
            except CollectionInvalid:
                # Created concurrently or already exists
                pass
            except Exception:
                # Non-fatal; dashboards can still work if collection is created on insert
                pass

        try:
            collection = db[name]
            for spec in index_specs:
                keys = spec.get("keys")
                if not keys:
                    continue
                unique = bool(spec.get("unique"))
                collection.create_index(keys, unique=unique)
                indexes_created.append(f"{name}:{keys}")
        except Exception:
            # Index creation failures should not prevent app startup
            continue

    return {"ok": True, "created": created, "indexes": indexes_created}