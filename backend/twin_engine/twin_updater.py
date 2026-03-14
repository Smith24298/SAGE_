from backend.database import employees
from backend.twin_engine.twin_schema import EmployeeTwin
from bson import ObjectId
from datetime import datetime

def update_digital_twin(
    name: str,
    insights: dict,
    ob_results: dict,
    original_text: str,
    ml_metrics: dict | None = None,
):
    if employees is None:
        raise Exception("Database connection not available")
    
    twin_data = employees.find_one({"name": name})
    
    if not twin_data:
        twin = EmployeeTwin(name=name)
        twin_data = twin.model_dump()
    else:
        # Convert _id to string or ignore if we want to replace
        if "_id" in twin_data:
            del twin_data["_id"]
    
    # Update OB
    twin_data["maslow_level"] = ob_results.get("maslow", twin_data.get("maslow_level"))
    
    db_herzberg = twin_data.get("herzberg", {"motivators": [], "hygiene_issues": []})
    db_herzberg["motivators"] = list(set(db_herzberg.get("motivators", []) + ob_results.get("herzberg_motivators", [])))
    db_herzberg["hygiene_issues"] = list(set(db_herzberg.get("hygiene_issues", []) + ob_results.get("herzberg_hygiene", [])))
    twin_data["herzberg"] = db_herzberg
    
    twin_data["management_style"] = ob_results.get("theory_xy", twin_data.get("management_style"))
    
    if ob_results.get("equity"):
        twin_data["equity_concerns"] = True
    
    # Update generic insights
    burnout_signal = str(insights.get("burnout_signal", "")).lower()
    if "high" in burnout_signal or "yes" in burnout_signal or "true" in burnout_signal:
        twin_data["burnout_risk"] = min(1.0, twin_data.get("burnout_risk", 0.0) + 0.2)

    if ml_metrics:
        metrics_payload = dict(ml_metrics)
        metrics_payload["updated_at"] = datetime.utcnow()
        twin_data["ml_metrics"] = metrics_payload

        try:
            current_risk = float(twin_data.get("burnout_risk", 0.0) or 0.0)
        except (TypeError, ValueError):
            current_risk = 0.0
        new_ml_risk = float(metrics_payload.get("burnout_score", 0.0) or 0.0)
        # Smooth burnout updates so each transcript influences but does not fully overwrite history.
        twin_data["burnout_risk"] = max(0.0, min(1.0, round(0.65 * current_risk + 0.35 * new_ml_risk, 4)))
    
    career_int = str(insights.get("career_interest", ""))
    if career_int and career_int not in twin_data.get("career_goals", []):
        twin_data.setdefault("career_goals", []).append(career_int)
    
    # Add to memory
    twin_data.setdefault("interaction_memory", []).append(original_text)
    
    # Keep only recent memory
    if len(twin_data["interaction_memory"]) > 10:
        twin_data["interaction_memory"] = twin_data["interaction_memory"][-10:]
        
    result = employees.update_one(
        {"name": name},
        {"$set": twin_data},
        upsert=True
    )
    
    return twin_data
