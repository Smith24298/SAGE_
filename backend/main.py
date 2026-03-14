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
from backend.pipelines.meeting_pipeline import process_meeting
from backend.rag.hr_assistant import hr_chat
from backend.firestore_seed import SeedConfigError, seed_employees_to_firestore
from backend.firebase_admin import get_firestore_client
from backend.ob_engine.behavioral_analyzer import generate_employee_intelligence_report
from backend.ob_engine.intelligence_storage import (
    store_intelligence_report,
    get_intelligence_report,
    get_employee_intelligence_history,
    update_digital_twin_with_intelligence,
    get_employee_behavioral_summary
)

app = FastAPI(title="AI HR Digital Twin Intelligence System")


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

frontend_origins = os.getenv("FRONTEND_ORIGINS", "")
allowed_origins = [
    origin.strip() for origin in frontend_origins.split(",") if origin.strip()
]

if not allowed_origins:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


class SeedEmployeesRequest(BaseModel):
    count: int = 25
    id_start: int = 1
    merge: bool = True
    dry_run: bool = False
    seed_json_path: str = os.path.join("frontend", "firestore-seed-employees.example.json")

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        if not request.question or not request.question.strip():
            return {
                "status": "error",
                "message": "Question cannot be empty"
            }, 400
        answer = hr_chat(request.question)
        return {"response": answer}
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
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


@app.post("/admin/seed/employees")
async def seed_employees(
    request: SeedEmployeesRequest,
    x_seed_token: Optional[str] = Header(default=None),
):
    """Seed Firestore employee collections.

    Protected by env var SEED_TOKEN. Provide the same token via header `x-seed-token`.
    """

    expected = os.getenv("SEED_TOKEN")
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Seeding is disabled (SEED_TOKEN is not set).",
        )

    if not x_seed_token or x_seed_token != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        result = seed_employees_to_firestore(
            seed_json_path=request.seed_json_path,
            count=request.count,
            id_start=request.id_start,
            merge=request.merge,
            dry_run=request.dry_run,
        )
        return {
            "status": "success",
            "result": {
                "employees_written": result.employees_written,
                "profiles_written": result.profiles_written,
                "photos_written": result.photos_written,
                "insights_written": result.insights_written,
            },
        }
    except SeedConfigError as e:
        raise HTTPException(status_code=400, detail=str(e))