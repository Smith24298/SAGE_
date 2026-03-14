import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.oauth2 import service_account
from googleapiclient.discovery import build
import datetime

router = APIRouter()

SCOPES = ['https://www.googleapis.com/auth/calendar']
# The path provided by user is c:\Users\DELL-7490-5\Desktop\SAGE_PDEU\SAGE_\mailautomation-490110-47a152e48569.json
# `main.py` is in `backend`, so `..\mailautomation-490110-47a152e48569.json` is the path from backend
SERVICE_ACCOUNT_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'mailautomation-490110-47a152e48569.json'))

class EventRequest(BaseModel):
    title: str
    date: str
    time: str
    location: str
    description: str
    attendee_email: str | None = None

@router.post("/api/calendar/event")
async def create_event(request: EventRequest):
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        raise HTTPException(status_code=500, detail=f"Service account file not found at {SERVICE_ACCOUNT_FILE}")

    try:
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        service = build('calendar', 'v3', credentials=credentials)
        
        # Parse time from 24h or 12h format?
        # HTML time inputs usually give HH:MM in 24-hr.
        start_datetime_str = f"{request.date}T{request.time}:00"
        start_dt = datetime.datetime.strptime(start_datetime_str, "%Y-%m-%dT%H:%M:%S")
        
        # Default 1-hour duration
        end_dt = start_dt + datetime.timedelta(hours=1)
        
        event: dict = {
            'summary': request.title,
            'location': request.location,
            'description': request.description,
            'start': {
                'dateTime': start_dt.isoformat(),
                'timeZone': 'Asia/Kolkata',  # Assuming India timezone based on time metadata
            },
            'end': {
                'dateTime': end_dt.isoformat(),
                'timeZone': 'Asia/Kolkata',
            }
        }

        if request.attendee_email:
            event['attendees'] = [{'email': request.attendee_email}]
        
        # Insert into the service account's primary calendar
        created_event = service.events().insert(calendarId='primary', body=event).execute()
        
        return {
            "status": "success",
            "event_link": created_event.get('htmlLink')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
