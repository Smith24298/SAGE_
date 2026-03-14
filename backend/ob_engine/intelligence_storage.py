"""
Storage and retrieval of Behavioral & Engagement Intelligence Reports

Stores reports in MongoDB, integrated with the digital twin system.
"""

from backend.database import db
from datetime import datetime
from bson import ObjectId
from typing import Optional, Dict
import re


def store_intelligence_report(report: dict, employee_id: Optional[str] = None) -> dict:
    """
    Store behavioral and engagement intelligence report in MongoDB.
    
    Args:
        report: Intelligence report dict with behavioral_intelligence and engagement_intelligence
        employee_id: Optional link to employee digital twin
        
    Returns:
        Stored report with MongoDB _id
    """
    
    if db is None:
        raise Exception("Database connection not available")
    
    collection = db["intelligence_reports"]
    
    report_document = {
        "employee": report.get("employee"),
        "employee_id": employee_id,
        "behavioral_intelligence": report.get("behavioral_intelligence"),
        "engagement_intelligence": report.get("engagement_intelligence"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = collection.insert_one(report_document)
    report_document["_id"] = result.inserted_id
    
    return report_document


def get_intelligence_report(report_id: str) -> Optional[dict]:
    """
    Retrieve intelligence report by ID.
    """
    
    if db is None:
        raise Exception("Database connection not available")
    
    collection = db["intelligence_reports"]
    
    return collection.find_one({"_id": ObjectId(report_id)})


def get_employee_intelligence_history(employee_name: str, limit: int = 10) -> list:
    """
    Get recent intelligence reports for an employee.
    """
    
    if db is None:
        raise Exception("Database connection not available")
    
    collection = db["intelligence_reports"]
    
    reports = list(collection.find(
        {"employee": employee_name}
    ).sort("created_at", -1).limit(limit))
    
    return reports


def update_digital_twin_with_intelligence(
    employee_name: str,
    intelligence_report: dict
) -> dict:
    """
    Update digital twin with behavioral and engagement intelligence data.
    
    Args:
        employee_name: Employee identifier
        intelligence_report: Report with behavioral_intelligence and engagement_intelligence
        
    Returns:
        Updated digital twin document
    """
    
    from backend.twin_engine.twin_schema import EmployeeTwin
    from backend.database import employees
    
    if employees is None:
        raise Exception("Database connection not available")
    
    behavioral = intelligence_report.get("behavioral_intelligence", {})
    engagement = intelligence_report.get("engagement_intelligence", {})
    
    twin_data = employees.find_one({"name": employee_name})
    
    if not twin_data:
        twin = EmployeeTwin(name=employee_name)
        twin_data = twin.model_dump()
    else:
        if "_id" in twin_data:
            del twin_data["_id"]
    
    # Update with behavioral intelligence
    if behavioral:
        twin_data["behavioral_profile"] = {
            "communication_style": behavioral.get("communication_style"),
            "personality_summary": behavioral.get("personality_summary"),
            "motivation_drivers": behavioral.get("motivation_drivers", []),
            "feedback_preference": behavioral.get("feedback_preference"),
            "collaboration_style": behavioral.get("collaboration_style"),
            "updated_at": datetime.utcnow()
        }
    
    # Update with engagement intelligence
    if engagement:
        twin_data["engagement_profile"] = {
            "engagement_level": engagement.get("engagement_level", 0.5),
            "participation": engagement.get("participation", 0.5),
            "responsiveness": engagement.get("responsiveness", 0.5),
            "initiative": engagement.get("initiative", 0.5),
            "key_signals": engagement.get("key_signals", []),
            "reasoning": engagement.get("reasoning", ""),
            "updated_at": datetime.utcnow()
        }
    
    # Update timestamp
    twin_data["updated_at"] = datetime.utcnow()
    
    # Upsert the digital twin
    result = employees.update_one(
        {"name": employee_name},
        {"$set": twin_data},
        upsert=True
    )
    
    # Retrieve and return the updated document
    return employees.find_one({"name": employee_name})


def get_employee_behavioral_summary(employee_name: str) -> Optional[dict]:
    """
    Get the latest behavioral and engagement summary for an employee from their digital twin.
    """
    
    from backend.database import employees
    
    if employees is None:
        return None
    
    lookup = (employee_name or "").strip()
    if not lookup:
        return None

    # Try exact match first.
    twin = employees.find_one({"name": lookup})

    # Fallback: case-insensitive exact match.
    if not twin:
        twin = employees.find_one({"name": {"$regex": f"^{re.escape(lookup)}$", "$options": "i"}})

    # Fallback: case-insensitive partial match (helps when using first name queries).
    if not twin:
        twin = employees.find_one({"name": {"$regex": re.escape(lookup), "$options": "i"}})
    
    if not twin:
        return None
    
    return {
        "employee": twin.get("name", lookup),
        "behavioral_profile": twin.get("behavioral_profile"),
        "engagement_profile": twin.get("engagement_profile"),
        "last_updated": twin.get("updated_at")
    }
