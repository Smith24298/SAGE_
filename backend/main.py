import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Optional

from dotenv import load_dotenv, find_dotenv

# Load environment variables regardless of current working directory.
# Prefer `backend/.env` (this repo's backend config), then fall back to any `.env`
# discoverable via python-dotenv's upward search.
_backend_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_backend_env):
    load_dotenv(dotenv_path=_backend_env, override=False)
else:
    load_dotenv(find_dotenv(usecwd=True), override=False)

from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from backend.database import db
from backend.firestore_seed import seed_employees_to_firestore
from backend.firebase_admin import get_firestore_client
from backend.mcp.intent_router import NAVIGATION_MODE, classify_intent, route_user_message
from backend.mcp.navigation_resolver import resolve_navigation
from backend.employee_store import (
    get_employee_insights,
    get_employee_profile,
    list_employees,
    upsert_employee,
)
from backend.pipelines.meeting_pipeline import process_meeting
from backend.ob_engine.behavioral_analyzer import generate_employee_intelligence_report
from backend.ob_engine.intelligence_storage import (
    store_intelligence_report,
    get_intelligence_report,
    get_employee_intelligence_history,
    update_digital_twin_with_intelligence,
    get_employee_behavioral_summary
)
from backend.calendar_service import router as calendar_router
from backend.dashboard_overview import build_dashboard_overview
from backend.database import ensure_mongo_collections
from backend.engagement_analytics import build_engagement_analytics
from backend.workforce_insights import build_workforce_insights

app = FastAPI(title="AI HR Digital Twin Intelligence System")

app.include_router(calendar_router)


@app.on_event("startup")
async def _auto_seed_firestore_on_startup():
    """Optionally seed Firestore with employee data on startup.

    Controlled by env vars:
      - FIRESTORE_AUTO_SEED=true|false (default false)
      - FIRESTORE_AUTO_SEED_COUNT (default 25)
      - FIRESTORE_AUTO_SEED_JSON (default frontend/firestore-seed-employees.example.json)

    Safe behavior: only seeds if `employee_profiles` is empty.
    """

    enabled = os.getenv("FIRESTORE_AUTO_SEED", "false").lower() in {"1", "true", "yes"}
    if not enabled:
        return

    db = get_firestore_client()
    if db is None:
        print("[auto-seed] Firestore not configured; skipping")
        return

    try:
        existing = db.collection("employee_profiles").limit(1).get()
        if existing:
            print("[auto-seed] employee_profiles not empty; skipping")
            return

        count = int(os.getenv("FIRESTORE_AUTO_SEED_COUNT", "25"))
        seed_json = os.getenv(
            "FIRESTORE_AUTO_SEED_JSON",
            os.path.join("frontend", "firestore-seed-employees.example.json"),
        )

        result = seed_employees_to_firestore(
            seed_json_path=seed_json,
            count=count,
            id_start=1,
            merge=True,
            dry_run=False,
        )
        print(f"[auto-seed] Seeded {result.employees_written} employees")
    except Exception as e:
        print(f"[auto-seed] Failed: {e}")


@app.on_event("startup")
async def _ensure_mongo_collections_on_startup():
    """Create required MongoDB collections/indexes if missing."""

    try:
        result = ensure_mongo_collections()
        if not result.get("ok"):
            print(f"[mongo-bootstrap] Skipped: {result.get('reason')}")
            return
        created = result.get("created") or []
        if created:
            print(f"[mongo-bootstrap] Created collections: {', '.join(created)}")
    except Exception as e:
        # Non-fatal
        print(f"[mongo-bootstrap] Failed: {e}")

app_env = os.getenv("APP_ENV", os.getenv("ENV", "development")).lower()

# CORS configuration
# - For normal production, set FRONTEND_ORIGINS to your deployed frontend URL(s).
# - To allow the API to be called from ANY website globally (not recommended for private APIs),
#   set FRONTEND_ORIGINS='*' OR CORS_ALLOW_ALL=true.
cors_allow_all = os.getenv("CORS_ALLOW_ALL", "").strip().lower() in {"1", "true", "yes"}
frontend_origins_raw = os.getenv("FRONTEND_ORIGINS", "").strip()
frontend_origin_regex = os.getenv("FRONTEND_ORIGIN_REGEX", "").strip() or None

if cors_allow_all or frontend_origins_raw == "*":
    allowed_origins = ["*"]
    allow_credentials = False  # cannot be True with '*' per CORS spec
    frontend_origin_regex = None
else:
    allowed_origins = [
        origin.strip() for origin in frontend_origins_raw.split(",") if origin.strip()
    ]
    allow_credentials = True

    if not allowed_origins:
        if app_env not in {"prod", "production"}:
            allowed_origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        else:
            # In production, require explicit FRONTEND_ORIGINS when calling cross-origin.
            # Same-origin deployments (reverse proxy) don't require CORS.
            allowed_origins = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=frontend_origin_regex,
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "HR AI Digital Twin"}

@app.post("/upload_transcript")
async def upload(file: UploadFile = File(...)):
    try:
        text = await file.read()
        text = text.decode()
        
        if not text.strip():
            return {
                "status": "error",
                "message": "File is empty"
            }, 400
        
        results = process_meeting(text)
        
        # Convert ObjectIds to strings if returning the results directly
        for k in results:
            if isinstance(results[k], dict) and "_id" in results[k]:
                results[k]["_id"] = str(results[k]["_id"])

        return {
            "status": "meeting processed",
            "processed_employees": list(results.keys()),
            "twins": results
        }
    except Exception as e:
        error_msg = str(e)
        if "SSL" in error_msg or "CERTIFICATE" in error_msg:
            return {
                "status": "error",
                "message": "Database connection failed. Check your MongoDB connection and SSL certificates.",
                "error_type": "DatabaseConnectionError",
                "details": error_msg
            }, 503
        return {
            "status": "error",
            "message": error_msg,
            "error_type": type(e).__name__
        }, 500

class ChatRequest(BaseModel):
    question: str

class IntelligenceAnalysisRequest(BaseModel):
    employee_name: str
    personality_data: dict
    transcript: str
    store_in_db: bool = True
    update_twin: bool = True

class BehavioralSummaryRequest(BaseModel):
    employee_name: str


class EmployeeUpsertRequest(BaseModel):
    profile: dict
    insights: Optional[dict] = None

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        if not request.question or not request.question.strip():
            return {
                "status": "error",
                "message": "Question cannot be empty"
            }, 400
        routed = route_user_message(request.question, concise=False)
        return routed
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }, 500


@app.post("/api/chat/intent")
async def chat_intent(request: ChatRequest):
    """Return intent routing decision without generating a final answer."""
    try:
        if not request.question or not request.question.strip():
            return {
                "status": "error",
                "message": "Question cannot be empty"
            }, 400
        decision = classify_intent(request.question)
        navigation = resolve_navigation(request.question) if decision.mode == NAVIGATION_MODE else None
        return {
            "status": "success",
            "routing": decision.to_dict(),
            "navigation": navigation.to_dict() if navigation else None,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }, 500


@app.get("/api/employees")
async def get_employees(limit: int = 200):
    try:
        data = list_employees(limit=limit)
        return {
            "status": "success",
            "count": len(data),
            "employees": data,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__,
        }, 500


@app.get("/api/employees/{employee_ref}/profile")
async def get_employee_profile_api(employee_ref: str):
    try:
        profile = get_employee_profile(employee_ref)
        if not profile:
            return {
                "status": "error",
                "message": f"Employee profile not found for {employee_ref}",
            }, 404
        return {
            "status": "success",
            "profile": profile,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__,
        }, 500


@app.get("/api/employees/{employee_ref}/insights")
async def get_employee_insights_api(employee_ref: str):
    try:
        insights = get_employee_insights(employee_ref)
        if not insights:
            return {
                "status": "error",
                "message": f"Employee insights not found for {employee_ref}",
            }, 404
        return {
            "status": "success",
            "insights": insights,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__,
        }, 500


@app.post("/api/employees/upsert")
async def upsert_employee_api(request: EmployeeUpsertRequest):
    try:
        result = upsert_employee(request.profile, request.insights)
        return {
            "status": "success",
            "employee": result,
        }
    except ValueError as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": "ValueError",
        }, 400
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__,
        }, 500

@app.post("/api/analyze/intelligence")
async def analyze_intelligence(request: IntelligenceAnalysisRequest):
    """
    Analyze employee behavioral and engagement intelligence.
    
    Accepts:
    - employee_name: Employee identifier
    - personality_data: Dict with personality/assessment data
    - transcript: Workplace conversation transcript
    - store_in_db: Whether to store report in MongoDB (default: True)
    - update_twin: Whether to update digital twin (default: True)
    
    Returns: Complete behavioral and engagement intelligence report
    """
    try:
        # Generate the intelligence report
        report = generate_employee_intelligence_report(
            request.employee_name,
            request.personality_data,
            request.transcript
        )
        
        stored_report = None
        updated_twin = None
        
        # Store in database if requested
        if request.store_in_db:
            stored_report = store_intelligence_report(report, employee_id=None)
            report["_id"] = str(stored_report["_id"])
        
        # Update digital twin if requested
        if request.update_twin:
            updated_twin = update_digital_twin_with_intelligence(
                request.employee_name,
                report
            )
            if "_id" in updated_twin:
                updated_twin["_id"] = str(updated_twin["_id"])
        
        return {
            "status": "success",
            "report": report,
            "stored_in_db": request.store_in_db,
            "twin_updated": request.update_twin
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }, 500

@app.get("/api/intelligence/report/{report_id}")
async def get_report(report_id: str):
    """
    Retrieve a stored intelligence report by ID.
    """
    try:
        report = get_intelligence_report(report_id)
        if not report:
            return {
                "status": "error",
                "message": "Report not found"
            }, 404
        
        report["_id"] = str(report["_id"])
        return {"status": "success", "report": report}
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }, 500

@app.get("/api/intelligence/history/{employee_name}")
async def get_history(employee_name: str, limit: int = 10):
    """
    Get recent intelligence reports for an employee.
    """
    try:
        reports = get_employee_intelligence_history(employee_name, limit)
        
        # Convert ObjectIds to strings
        for report in reports:
            report["_id"] = str(report["_id"])
        
        return {
            "status": "success",
            "employee": employee_name,
            "reports_count": len(reports),
            "reports": reports
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }, 500

@app.get("/api/meeting_summaries")
async def get_meeting_summaries(limit: int = 10):
    try:
        cursor = db["meeting_summaries"].find({}).sort("created_at", -1).limit(limit)
        summaries = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            summaries.append(doc)
        return {"status": "success", "summaries": summaries}
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

@app.get("/api/meeting_summaries/{summary_id}")
async def get_meeting_summary(summary_id: str):
    try:
        from bson import ObjectId
        doc = db["meeting_summaries"].find_one({"_id": ObjectId(summary_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Meeting summary not found")
        
        doc["_id"] = str(doc["_id"])
        return {"status": "success", "summary": doc}
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500


@app.get("/api/dashboard/overview")
async def get_dashboard_overview():
    """Return Mongo-backed analytics payload for CHRO dashboard cards and charts."""
    try:
        overview = build_dashboard_overview()
        return {
            "status": "success",
            "overview": overview,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__,
        }, 500

@app.get("/api/intelligence/summary/{employee_name}")
async def get_summary(employee_name: str):
    """
    Get the latest behavioral and engagement summary for an employee.
    """
    try:
        summary = get_employee_behavioral_summary(employee_name)
        if not summary:
            return {
                "status": "error",
                "message": f"No intelligence data found for {employee_name}"
            }, 404
        
        return {
            "status": "success",
            "summary": summary
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }, 500


@app.get("/api/engagement/analytics")
async def get_engagement_analytics():
    """Return real Mongo-backed engagement analytics for Engagement Manager."""

    try:
        analytics = build_engagement_analytics()
        return {
            "status": "success",
            "analytics": analytics,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__,
        }, 500


@app.get("/api/workforce/insights")
async def get_workforce_insights(window_days: int = 90):
    """Return Mongo-backed workforce insights (headcount, growth, diversity, KPIs)."""

    try:
        payload = build_workforce_insights(window_days=window_days)
        return {
            "status": "success",
            "insights": payload,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__,
        }, 500