import datetime
import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from google.oauth2 import service_account
from googleapiclient.discovery import build
from pydantic import BaseModel, Field

from backend.database import db

router = APIRouter()

SCOPES = ["https://www.googleapis.com/auth/calendar"]
DEFAULT_SERVICE_ACCOUNT_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "mailautomation-490110-47a152e48569.json")
)
DEFAULT_TIMEZONE = os.getenv("CALENDAR_TIMEZONE", "Asia/Kolkata")
CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")
EVENTS_COLLECTION = "dashboard_events"


def _resolve_credentials_path(path: Optional[str]) -> str:
    if not path:
        return ""
    if os.path.isabs(path):
        return path

    backend_dir = os.path.dirname(__file__)
    candidate = os.path.normpath(os.path.join(backend_dir, path))
    if os.path.isfile(candidate):
        return candidate

    return os.path.abspath(path)


_raw_credentials_path = (
    os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
    or os.getenv("FIREBASE_ADMIN_SDK_PATH")
    or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    or DEFAULT_SERVICE_ACCOUNT_FILE
)
SERVICE_ACCOUNT_FILE = _resolve_credentials_path(_raw_credentials_path)

class EventRequest(BaseModel):
    title: str
    date: str
    time: str
    location: str
    description: str
    attendee_email: Optional[str] = None
    attendees: int = 0
    type: str = "Fun"
    session_id: Optional[str] = None
    sync_to_google: bool = True
    duration_minutes: int = Field(default=60, ge=15, le=720)


def _events_collection():
    if db is None:
        return None
    return db[EVENTS_COLLECTION]


def _parse_event_datetime(date_text: str, time_text: str) -> datetime.datetime:
    try:
        date_part = datetime.datetime.strptime(date_text, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.") from exc

    clean_time = str(time_text or "").strip()
    parsed_time = None
    for fmt in ("%H:%M:%S", "%H:%M", "%I:%M %p", "%I:%M%p"):
        try:
            parsed_time = datetime.datetime.strptime(clean_time, fmt).time()
            break
        except ValueError:
            continue

    if parsed_time is None:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM.")

    return datetime.datetime.combine(date_part, parsed_time)


def _sync_to_google(
    title: str,
    location: str,
    description: str,
    attendee_email: Optional[str],
    start_dt: datetime.datetime,
    end_dt: datetime.datetime,
) -> str:
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        raise FileNotFoundError(f"Service account file not found at {SERVICE_ACCOUNT_FILE}")

    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=SCOPES,
    )
    service = build("calendar", "v3", credentials=credentials)

    event: dict = {
        "summary": title,
        "location": location,
        "description": description,
        "start": {
            "dateTime": start_dt.isoformat(),
            "timeZone": DEFAULT_TIMEZONE,
        },
        "end": {
            "dateTime": end_dt.isoformat(),
            "timeZone": DEFAULT_TIMEZONE,
        },
    }

    if attendee_email:
        event["attendees"] = [{"email": attendee_email}]

    created_event = service.events().insert(calendarId=CALENDAR_ID, body=event).execute()
    return created_event.get("htmlLink", "")


def _friendly_google_sync_error(exc: Exception) -> str:
    message = str(exc)
    lower_msg = message.lower()

    if "service account file not found" in lower_msg:
        return (
            f"Service account file not found at {SERVICE_ACCOUNT_FILE}. "
            "Set GOOGLE_SERVICE_ACCOUNT_FILE (or FIREBASE_ADMIN_SDK_PATH) to a valid JSON key path."
        )

    if "accessnotconfigured" in lower_msg or "calendar api has not been used" in lower_msg:
        return (
            "Google Calendar API is disabled for this project. "
            "Enable calendar-json.googleapis.com in Google Cloud Console and retry in a few minutes."
        )

    if "forbidden" in lower_msg or "insufficient permissions" in lower_msg:
        return (
            "Service account does not have permission to write to this calendar. "
            "Share the calendar with the service-account email and grant event edit access."
        )

    return message


def _serialize_event(doc: dict) -> dict:
    created_at = doc.get("created_at")
    if isinstance(created_at, datetime.datetime):
        if created_at.tzinfo is None:
            created_at_str = created_at.isoformat() + "Z"
        else:
            created_at_str = created_at.astimezone(datetime.timezone.utc).isoformat()
    else:
        created_at_str = ""

    return {
        "id": str(doc.get("_id", "")),
        "title": doc.get("title", ""),
        "date": doc.get("date", ""),
        "time": doc.get("time", ""),
        "location": doc.get("location", ""),
        "description": doc.get("description", ""),
        "attendee_email": doc.get("attendee_email"),
        "attendees": int(doc.get("attendees", 0) or 0),
        "type": doc.get("type", "Fun"),
        "session_id": doc.get("session_id", "default"),
        "status": doc.get("status", "upcoming"),
        "event_link": doc.get("event_link"),
        "google_sync_error": doc.get("google_sync_error"),
        "created_at": created_at_str,
    }

@router.post("/api/calendar/event")
async def create_event(request: EventRequest):
    events_collection = _events_collection()
    if events_collection is None:
        raise HTTPException(status_code=503, detail="Database connection not available")

    start_dt = _parse_event_datetime(request.date, request.time)
    end_dt = start_dt + datetime.timedelta(minutes=request.duration_minutes)
    status = "upcoming" if start_dt >= datetime.datetime.now() else "past"

    event_link = None
    google_sync_error = None
    if request.sync_to_google:
        try:
            event_link = _sync_to_google(
                title=request.title,
                location=request.location,
                description=request.description,
                attendee_email=request.attendee_email,
                start_dt=start_dt,
                end_dt=end_dt,
            )
        except Exception as exc:
            # Persist the dashboard event even if Google sync fails.
            google_sync_error = _friendly_google_sync_error(exc)

    now_utc = datetime.datetime.utcnow()
    event_doc = {
        "title": request.title.strip(),
        "date": start_dt.date().isoformat(),
        "time": start_dt.strftime("%H:%M"),
        "location": request.location.strip(),
        "description": request.description.strip(),
        "attendee_email": request.attendee_email,
        "attendees": max(0, int(request.attendees or 0)),
        "type": (request.type or "Fun").strip() or "Fun",
        "session_id": (request.session_id or "default").strip() or "default",
        "status": status,
        "event_link": event_link,
        "google_sync_error": google_sync_error,
        "google_synced": bool(event_link),
        "created_at": now_utc,
        "updated_at": now_utc,
    }

    inserted = events_collection.insert_one(event_doc)
    saved = events_collection.find_one({"_id": inserted.inserted_id})
    if saved is None:
        event_doc["_id"] = inserted.inserted_id
        saved = event_doc

    return {
        "status": "success",
        "event": _serialize_event(saved),
        "event_link": event_link,
        "google_sync_error": google_sync_error,
    }


@router.get("/api/calendar/events")
async def list_events(session_id: Optional[str] = None, limit: int = 100):
    events_collection = _events_collection()
    if events_collection is None:
        raise HTTPException(status_code=503, detail="Database connection not available")

    safe_limit = max(1, min(limit, 500))
    query = {}
    if session_id and session_id.strip():
        query["session_id"] = session_id.strip()

    cursor = events_collection.find(query).sort(
        [("date", 1), ("time", 1), ("created_at", -1)]
    ).limit(safe_limit)
    events = [_serialize_event(doc) for doc in cursor]

    return {
        "status": "success",
        "count": len(events),
        "events": events,
    }
