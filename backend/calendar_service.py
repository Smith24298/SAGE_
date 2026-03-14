import datetime
import os
import re
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from google.oauth2 import service_account
from googleapiclient.discovery import build
from pydantic import BaseModel, Field

from backend.database import db
from backend.notifications.email_service import send_event_notifications

router = APIRouter()

SCOPES = ["https://www.googleapis.com/auth/calendar"]
DEFAULT_SERVICE_ACCOUNT_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "mailautomation-490110-47a152e48569.json")
)
DEFAULT_TIMEZONE = os.getenv("CALENDAR_TIMEZONE", "Asia/Kolkata")
CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")
EVENTS_COLLECTION = "dashboard_events"
PROFILES_COLLECTION = "employee_profiles"
ROLE_ALLOWED_TO_NOTIFY = {"engagement_manager"}
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


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
    notify_employees: bool = False
    recipient_emails: list[str] = Field(default_factory=list)
    recipient_employee_ids: list[str] = Field(default_factory=list)
    created_by_role: Optional[str] = None


def _events_collection():
    if db is None:
        return None
    return db[EVENTS_COLLECTION]


def _profiles_collection():
    if db is None:
        return None
    return db[PROFILES_COLLECTION]


def _normalize_role(role: Optional[str]) -> str:
    return str(role or "").strip().lower()


def _is_valid_email(value: str) -> bool:
    return bool(EMAIL_PATTERN.match(str(value or "").strip()))


def _clean_email(value: Optional[str]) -> Optional[str]:
    email = str(value or "").strip().lower()
    if not email:
        return None
    if not _is_valid_email(email):
        return None
    return email


def _extract_profile_email(profile: dict[str, Any]) -> Optional[str]:
    for key in (
        "email",
        "email_id",
        "emailId",
        "work_email",
        "workEmail",
        "official_email",
        "officialEmail",
    ):
        candidate = _clean_email(profile.get(key))
        if candidate:
            return candidate
    return None


def _find_employee_profile_by_ref(employee_ref: str) -> Optional[dict[str, Any]]:
    collection = _profiles_collection()
    if collection is None:
        return None

    ref = str(employee_ref or "").strip()
    if not ref:
        return None

    query = {
        "$or": [
            {"id": ref},
            {"employeeId": ref},
            {"name": {"$regex": f"^{re.escape(ref)}$", "$options": "i"}},
        ]
    }
    return collection.find_one(query)


def _append_all_mongo_employee_recipients(
    recipients_by_email: dict[str, dict[str, str]],
    warnings: list[str],
) -> None:
    collection = _profiles_collection()
    if collection is None:
        warnings.append("Could not load employee profiles from MongoDB for auto-notification.")
        return

    total_profiles = 0
    added_recipients = 0
    missing_email_profiles = 0

    cursor = collection.find(
        {},
        {
            "name": 1,
            "email": 1,
            "email_id": 1,
            "emailId": 1,
            "work_email": 1,
            "workEmail": 1,
            "official_email": 1,
            "officialEmail": 1,
        },
    )

    for profile in cursor:
        total_profiles += 1
        email = _extract_profile_email(profile)
        if not email:
            missing_email_profiles += 1
            continue

        already_exists = email in recipients_by_email
        recipients_by_email[email] = {
            "email": email,
            "name": str(profile.get("name") or recipients_by_email.get(email, {}).get("name", "")).strip(),
        }
        if not already_exists:
            added_recipients += 1

    if total_profiles == 0:
        warnings.append("No employee profiles found in MongoDB.")
        return

    if added_recipients == 0 and len(recipients_by_email) == 0:
        warnings.append("No employee emails found in MongoDB profiles.")
    elif added_recipients > 0:
        warnings.append(f"Auto-selected {added_recipients} employee recipient(s) from MongoDB.")

    if missing_email_profiles > 0:
        warnings.append(
            f"{missing_email_profiles} employee profile(s) skipped due to missing email in MongoDB."
        )


def _resolve_notification_recipients(request: EventRequest) -> tuple[list[dict[str, str]], list[str]]:
    recipients_by_email: dict[str, dict[str, str]] = {}
    warnings: list[str] = []
    explicit_recipient_input = bool(
        request.recipient_emails
        or request.recipient_employee_ids
        or _clean_email(request.attendee_email)
    )

    for raw_email in request.recipient_emails:
        clean = _clean_email(raw_email)
        if not clean:
            text = str(raw_email or "").strip()
            if text:
                warnings.append(f"Ignored invalid email: {text}")
            continue
        recipients_by_email[clean] = {
            "email": clean,
            "name": "",
        }

    attendee_email = _clean_email(request.attendee_email)
    if attendee_email:
        recipients_by_email[attendee_email] = {
            "email": attendee_email,
            "name": recipients_by_email.get(attendee_email, {}).get("name", ""),
        }

    for ref in request.recipient_employee_ids:
        profile = _find_employee_profile_by_ref(ref)
        if not profile:
            warnings.append(f"Employee not found for reference: {ref}")
            continue

        email = _extract_profile_email(profile)
        if not email:
            display_name = str(profile.get("name") or ref)
            warnings.append(f"No email found for employee: {display_name}")
            continue

        recipients_by_email[email] = {
            "email": email,
            "name": str(profile.get("name") or "").strip(),
        }

    # Default behavior for "Add Event" from EM: if no explicit recipients were
    # selected, target all employees with valid emails from MongoDB profiles.
    if not explicit_recipient_input:
        _append_all_mongo_employee_recipients(recipients_by_email, warnings)

    recipients = list(recipients_by_email.values())
    return recipients, warnings


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
        "notification_requested": bool(doc.get("notification_requested", False)),
        "notification_role": doc.get("notification_role"),
        "notification_recipients": doc.get("notification_recipients") or [],
        "email_notification": doc.get("email_notification"),
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
    email_notification = None
    notification_recipients: list[dict[str, str]] = []
    notification_role = _normalize_role(request.created_by_role)
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

    if request.notify_employees:
        if notification_role not in ROLE_ALLOWED_TO_NOTIFY:
            email_notification = {
                "status": "skipped",
                "reason": "Only engagement managers can trigger event notification emails.",
                "requested": True,
                "configured": False,
                "total": 0,
                "sent_count": 0,
                "failed_count": 0,
                "results": [],
            }
        else:
            notification_recipients, recipient_warnings = _resolve_notification_recipients(request)

            try:
                email_notification = send_event_notifications(
                    event_doc={
                        "title": request.title,
                        "type": request.type,
                        "date": start_dt.date().isoformat(),
                        "time": start_dt.strftime("%H:%M"),
                        "location": request.location,
                        "description": request.description,
                        "attendees": max(0, int(request.attendees or 0)),
                        "event_link": event_link,
                    },
                    recipients=notification_recipients,
                )
            except Exception as exc:
                email_notification = {
                    "status": "failed",
                    "reason": str(exc),
                    "requested": True,
                    "configured": False,
                    "total": len(notification_recipients),
                    "sent_count": 0,
                    "failed_count": len(notification_recipients),
                    "results": [],
                }

            if recipient_warnings:
                email_notification["recipient_warnings"] = recipient_warnings

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
        "notification_requested": bool(request.notify_employees),
        "notification_role": notification_role,
        "notification_recipients": notification_recipients,
        "email_notification": email_notification,
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
        "email_notification": email_notification,
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

@router.post("/api/calendar/events/{event_id}/complete")
async def complete_event(event_id: str):
    events_collection = _events_collection()
    if events_collection is None:
        raise HTTPException(status_code=503, detail="Database connection not available")

    try:
        from bson import ObjectId
        obj_id = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID format")

    result = events_collection.update_one(
        {"_id": obj_id},
        {"$set": {"status": "past", "updated_at": datetime.datetime.utcnow()}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")

    return {"status": "success", "message": "Event marked as completed"}
