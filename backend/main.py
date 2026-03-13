from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from backend.pipelines.meeting_pipeline import process_meeting
from backend.rag.hr_assistant import hr_chat
import os

load_dotenv()

app = FastAPI(title="AI HR Digital Twin Intelligence System")

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