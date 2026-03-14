"""Mongo-backed employee profile and insights store.

This module replaces frontend Firestore reads with backend API reads from MongoDB.
"""

from __future__ import annotations

import re
from copy import deepcopy
from typing import Any, Optional

from backend.database import db, employees

PROFILES_COLLECTION = "employee_profiles"
INSIGHTS_COLLECTION = "employee_insights"


def _profiles_collection():
    if db is None:
        return None
    return db[PROFILES_COLLECTION]


def _insights_collection():
    if db is None:
        return None
    return db[INSIGHTS_COLLECTION]


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_profile_doc(profile_doc: dict[str, Any]) -> dict[str, Any]:
    profile = deepcopy(profile_doc)
    profile.pop("_id", None)

    profile_id = str(
        profile.get("id")
        or profile.get("employeeId")
        or profile.get("name", "")
    ).strip()
    profile["id"] = profile_id
    profile["avatarIndex"] = _to_int(profile.get("avatarIndex"), 0)

    profile.setdefault("name", "")
    profile.setdefault("role", "")
    profile.setdefault("department", "")
    profile.setdefault("manager", "")
    profile.setdefault("dateOfJoining", "")
    profile.setdefault("employmentType", "")
    profile.setdefault("location", "")
    profile.setdefault("employeeId", profile_id)
    profile.setdefault("email", "")
    profile.setdefault("email_id", "")
    profile.setdefault("emailId", "")
    profile.setdefault("workEmail", "")
    profile.setdefault("baseSalary", "")
    profile.setdefault("bonus", "")
    profile.setdefault("stockOptions", "")
    profile.setdefault("totalCompensation", "")
    profile.setdefault("lastRevision", "")
    profile.setdefault("nextReview", "")
    profile.setdefault("salaryHistory", [])

    return profile


def _risk_from_burnout(burnout: Any) -> str:
    score = _to_float(burnout, 0.0)
    if score >= 0.7:
        return "High"
    if score >= 0.4:
        return "Medium"
    return "Low"


def _sentiment_from_twin(twin_doc: dict[str, Any], fallback: int = 70) -> int:
    engagement = (twin_doc or {}).get("engagement_profile") or {}
    level = engagement.get("engagement_level")
    if level is None:
        return fallback

    raw = _to_float(level, fallback / 100.0)
    if raw <= 1.0:
        raw *= 100.0
    return max(0, min(100, int(round(raw))))


def _metric_score(value: Any, default: int = 70) -> int:
    raw = _to_float(value, default / 100.0)
    if raw <= 1.0:
        raw *= 100.0
    return max(0, min(100, int(round(raw))))


def _default_risk_indicators(risk_level: str) -> list[dict[str, str]]:
    color_by_level = {
        "Low": "bg-green-500",
        "Medium": "bg-yellow-500",
        "High": "bg-red-500",
    }
    color = color_by_level.get(risk_level, "bg-yellow-500")
    return [
        {"label": "Burnout Risk", "level": risk_level, "color": color},
        {"label": "Attrition Risk", "level": risk_level, "color": color},
        {"label": "Engagement Decline", "level": risk_level, "color": color},
        {"label": "Stress Signals", "level": risk_level, "color": color},
    ]


def _find_twin_by_name(name: str) -> Optional[dict[str, Any]]:
    if employees is None:
        return None

    lookup = str(name or "").strip()
    if not lookup:
        return None

    twin = employees.find_one({"name": lookup})
    if twin:
        return twin

    twin = employees.find_one({"name": {"$regex": f"^{re.escape(lookup)}$", "$options": "i"}})
    if twin:
        return twin

    return employees.find_one({"name": {"$regex": re.escape(lookup), "$options": "i"}})


def _build_insights_from_twin(
    twin_doc: dict[str, Any],
    existing_insights: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    merged = deepcopy(existing_insights or {})
    merged.pop("_id", None)

    behavioral_profile = (twin_doc or {}).get("behavioral_profile") or {}
    engagement_profile = (twin_doc or {}).get("engagement_profile") or {}

    behavioral = merged.get("behavioral") or {}
    behavioral.setdefault("communicationStyle", behavioral_profile.get("communication_style"))
    behavioral.setdefault("personalityTraits", behavioral_profile.get("personality_summary"))
    behavioral.setdefault(
        "motivationDrivers",
        ", ".join(behavioral_profile.get("motivation_drivers", []))
        if isinstance(behavioral_profile.get("motivation_drivers"), list)
        else behavioral_profile.get("motivation_drivers"),
    )
    behavioral.setdefault("feedbackPreference", behavioral_profile.get("feedback_preference"))
    behavioral.setdefault("collaborationStyle", behavioral_profile.get("collaboration_style"))
    merged["behavioral"] = behavioral

    communication = merged.get("communication") or {}
    key_signals = engagement_profile.get("key_signals")
    if isinstance(key_signals, list) and key_signals and not communication.get("topTopics"):
        communication["topTopics"] = key_signals[:3]
    communication.setdefault("topTopics", [])
    communication.setdefault("concernsRaised", [])
    communication.setdefault("careerInterests", [])
    communication.setdefault("recentTopics", [])
    merged["communication"] = communication

    engagement_metrics = merged.get("engagementMetrics")
    if not engagement_metrics:
        engagement_metrics = [
            {
                "metric": "Engagement",
                "score": _metric_score(engagement_profile.get("engagement_level"), 70),
                "fill": "#e1634a",
            },
            {
                "metric": "Participation",
                "score": _metric_score(engagement_profile.get("participation"), 70),
                "fill": "#6b9080",
            },
            {
                "metric": "Responsiveness",
                "score": _metric_score(engagement_profile.get("responsiveness"), 70),
                "fill": "#a4b8c4",
            },
            {
                "metric": "Initiative",
                "score": _metric_score(engagement_profile.get("initiative"), 70),
                "fill": "#f4a261",
            },
        ]
    merged["engagementMetrics"] = engagement_metrics

    sentiment = _to_int(merged.get("sentiment"), -1)
    if sentiment < 0:
        sentiment = _sentiment_from_twin(twin_doc, 70)
    merged["sentiment"] = max(0, min(100, sentiment))

    risk_level = merged.get("risk")
    if risk_level not in {"Low", "Medium", "High"}:
        risk_level = _risk_from_burnout((twin_doc or {}).get("burnout_risk"))
    merged["risk"] = risk_level

    merged.setdefault("riskIndicators", _default_risk_indicators(risk_level))
    merged.setdefault("meetings", [])
    merged.setdefault("sentimentTrend", [])
    merged.setdefault("positiveNegative", f"{merged['sentiment']}/{100 - merged['sentiment']}")

    return merged


def _profile_query_from_ref(employee_ref: str) -> dict[str, Any]:
    ref = str(employee_ref or "").strip()
    exact_name = {"$regex": f"^{re.escape(ref)}$", "$options": "i"}
    return {
        "$or": [
            {"id": ref},
            {"employeeId": ref},
            {"name": exact_name},
        ]
    }


def _find_profile(employee_ref: str) -> Optional[dict[str, Any]]:
    collection = _profiles_collection()
    if collection is None:
        return None

    ref = str(employee_ref or "").strip()
    if not ref:
        return None

    profile = collection.find_one(_profile_query_from_ref(ref))
    if profile:
        return _normalize_profile_doc(profile)

    profile = collection.find_one({"name": {"$regex": re.escape(ref), "$options": "i"}})
    return _normalize_profile_doc(profile) if profile else None


def _find_insights_by_profile(profile: dict[str, Any]) -> Optional[dict[str, Any]]:
    collection = _insights_collection()
    if collection is None:
        return None

    profile_id = str(profile.get("id", "")).strip()
    employee_id = str(profile.get("employeeId", "")).strip()
    name = str(profile.get("name", "")).strip()

    queries = [
        {"employeeId": profile_id},
        {"employeeId": employee_id},
        {"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}},
    ]

    for query in queries:
        doc = collection.find_one(query)
        if doc:
            doc.pop("_id", None)
            return doc

    return None


def list_employees(limit: int = 200) -> list[dict[str, Any]]:
    collection = _profiles_collection()
    if collection is None:
        return []

    profiles = [_normalize_profile_doc(doc) for doc in collection.find().limit(limit)]

    def _sort_key(profile: dict[str, Any]):
        profile_id = str(profile.get("id", ""))
        return (_to_int(profile_id, 10**9), profile_id)

    profiles.sort(key=_sort_key)

    merged_list: list[dict[str, Any]] = []
    for profile in profiles:
        twin_doc = _find_twin_by_name(profile.get("name", "")) or {}
        insights_doc = _find_insights_by_profile(profile)
        merged_insights = _build_insights_from_twin(twin_doc, insights_doc)

        merged_list.append(
            {
                "id": _to_int(profile.get("id"), 0),
                "name": profile.get("name", ""),
                "role": profile.get("role", ""),
                "department": profile.get("department", ""),
                "sentiment": _to_int(merged_insights.get("sentiment"), 70),
                "risk": merged_insights.get("risk", "Medium"),
                "manager": profile.get("manager", ""),
                "dateOfJoining": profile.get("dateOfJoining", ""),
                "employmentType": profile.get("employmentType", ""),
                "location": profile.get("location", ""),
                "employeeId": profile.get("employeeId", ""),
                "email": (
                    profile.get("email")
                    or profile.get("email_id")
                    or profile.get("emailId")
                    or profile.get("workEmail")
                    or profile.get("work_email")
                    or None
                ),
                "baseSalary": profile.get("baseSalary", ""),
                "bonus": profile.get("bonus", ""),
                "stockOptions": profile.get("stockOptions", ""),
                "totalCompensation": profile.get("totalCompensation", ""),
                "lastRevision": profile.get("lastRevision", ""),
                "nextReview": profile.get("nextReview", ""),
                "avatarIndex": _to_int(profile.get("avatarIndex"), 0),
                "photoUrl": None,
            }
        )

    return merged_list


def get_employee_profile(employee_ref: str) -> Optional[dict[str, Any]]:
    return _find_profile(employee_ref)


def get_employee_insights(employee_ref: str) -> Optional[dict[str, Any]]:
    profile = _find_profile(employee_ref)
    if not profile:
        return None

    twin_doc = _find_twin_by_name(profile.get("name", "")) or {}
    insights_doc = _find_insights_by_profile(profile)
    merged = _build_insights_from_twin(twin_doc, insights_doc)
    merged["employeeId"] = str(profile.get("id", ""))
    return merged


def upsert_employee(profile: dict[str, Any], insights: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    profiles = _profiles_collection()
    insights_collection = _insights_collection()
    if profiles is None or insights_collection is None:
        raise RuntimeError("Database connection not available")

    normalized_profile = _normalize_profile_doc(profile)
    profile_id = str(normalized_profile.get("id", "")).strip()
    if not profile_id:
        raise ValueError("Employee profile must include id or employeeId")

    profiles.update_one(
        {"id": profile_id},
        {"$set": normalized_profile},
        upsert=True,
    )

    if insights is not None:
        normalized_insights = deepcopy(insights)
        normalized_insights.pop("_id", None)
        normalized_insights["employeeId"] = profile_id
        normalized_insights["name"] = normalized_profile.get("name", "")
        insights_collection.update_one(
            {"employeeId": profile_id},
            {"$set": normalized_insights},
            upsert=True,
        )

    return {
        "profile": get_employee_profile(profile_id),
        "insights": get_employee_insights(profile_id),
    }
