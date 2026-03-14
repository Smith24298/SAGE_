"""Sync Mongo digital twin updates into Firestore dashboard collections."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from backend.database import employees as mongo_twins
from backend.firebase_admin import get_firestore_client

from .prediction_models import clamp, predict_positive_sentiment


_COLOR_BY_LEVEL = {
    "Low": "bg-green-500",
    "Medium": "bg-yellow-500",
    "High": "bg-red-500",
}


def _safe_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _safe_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _norm_01(value: Any, default: float = 0.5) -> float:
    try:
        raw = float(value)
    except (TypeError, ValueError):
        return default

    if raw > 1.0:
        return clamp(raw / 100.0)
    return clamp(raw)


def _to_percent(value: Any, default: int = 50) -> int:
    pct = round(100 * _norm_01(value, default=default / 100.0))
    return int(max(0, min(100, pct)))


def _risk_level_from_burnout(burnout_risk: float) -> str:
    value = clamp(burnout_risk)
    if value >= 0.7:
        return "High"
    if value >= 0.45:
        return "Medium"
    return "Low"


def _sentiment_label(score: int) -> str:
    if score >= 75:
        return "Positive"
    if score >= 55:
        return "Neutral"
    return "Concerned"


def _sentiment_color(sentiment_label: str) -> str:
    if sentiment_label == "Positive":
        return "bg-green-500"
    if sentiment_label == "Neutral":
        return "bg-yellow-500"
    return "bg-orange-500"


def _summarize_topic(text: str) -> str:
    cleaned = " ".join((text or "").strip().split())
    if not cleaned:
        return "Transcript update"

    # Keep only the first sentence-sized chunk for dashboard readability.
    first = re.split(r"[.!?]", cleaned, maxsplit=1)[0].strip()
    if len(first) > 64:
        return first[:61].rstrip() + "..."
    return first


def _build_profile_index(firestore_client):
    profile_collection = firestore_client.collection("employee_profiles")
    index: dict[str, str] = {}
    max_numeric_id = 0

    for doc in profile_collection.stream():
        data = doc.to_dict() or {}
        name = str(data.get("name", "")).strip().lower()
        if name:
            index[name] = doc.id
        if str(doc.id).isdigit():
            max_numeric_id = max(max_numeric_id, int(doc.id))

    return profile_collection, index, max_numeric_id


def _update_sentiment_trend(existing_trend: list[Any], sentiment_score: int) -> list[dict[str, int]]:
    month = datetime.utcnow().strftime("%b")
    trend: list[dict[str, int]] = []
    replaced = False

    for row in existing_trend:
        if not isinstance(row, dict):
            continue
        row_month = str(row.get("month", "")).strip()
        if not row_month:
            continue

        try:
            row_score = int(round(float(row.get("score", sentiment_score))))
        except (TypeError, ValueError):
            row_score = sentiment_score

        if row_month.lower() == month.lower():
            trend.append({"month": month, "score": sentiment_score})
            replaced = True
        else:
            trend.append({"month": row_month, "score": max(0, min(100, row_score))})

    if not replaced:
        trend.append({"month": month, "score": sentiment_score})

    return trend[-6:]


def _build_engagement_metrics(engagement_profile: dict[str, Any]) -> list[dict[str, Any]]:
    engagement_pct = _to_percent(engagement_profile.get("engagement_level"), default=50)
    participation_pct = _to_percent(engagement_profile.get("participation"), default=50)
    responsiveness_pct = _to_percent(engagement_profile.get("responsiveness"), default=50)
    initiative_pct = _to_percent(engagement_profile.get("initiative"), default=50)

    if engagement_pct == 50:
        engagement_pct = int(round((participation_pct + responsiveness_pct + initiative_pct) / 3))

    return [
        {"metric": "Engagement", "score": engagement_pct, "fill": "#e1634a"},
        {"metric": "Participation", "score": participation_pct, "fill": "#6b9080"},
        {"metric": "Responsiveness", "score": responsiveness_pct, "fill": "#a4b8c4"},
        {"metric": "Initiative", "score": initiative_pct, "fill": "#f4a261"},
    ]


def _build_risk_indicators(
    burnout_risk: float,
    attrition_level: str,
    engagement_profile: dict[str, Any],
) -> list[dict[str, str]]:
    engagement_level = _norm_01(engagement_profile.get("engagement_level"), default=0.5)

    if engagement_level < 0.45:
        engagement_drop = "High"
    elif engagement_level < 0.7:
        engagement_drop = "Medium"
    else:
        engagement_drop = "Low"

    stress_level = _risk_level_from_burnout(max(burnout_risk, 1.0 - engagement_level))
    burnout_level = _risk_level_from_burnout(burnout_risk)

    return [
        {
            "label": "Burnout Risk",
            "level": burnout_level,
            "color": _COLOR_BY_LEVEL[burnout_level],
        },
        {
            "label": "Attrition Risk",
            "level": attrition_level,
            "color": _COLOR_BY_LEVEL[attrition_level],
        },
        {
            "label": "Engagement Decline",
            "level": engagement_drop,
            "color": _COLOR_BY_LEVEL[engagement_drop],
        },
        {
            "label": "Stress Signals",
            "level": stress_level,
            "color": _COLOR_BY_LEVEL[stress_level],
        },
    ]


def _build_default_profile_doc(name: str, twin: dict[str, Any], doc_id: str) -> dict[str, Any]:
    numeric_part = int(doc_id) if str(doc_id).isdigit() else 0
    return {
        "name": name,
        "role": str(twin.get("role", "Employee")),
        "department": str(twin.get("department", "Unknown")),
        "manager": str(twin.get("manager", "Unknown")),
        "dateOfJoining": "",
        "employmentType": "Full-time",
        "location": "Unknown",
        "employeeId": f"EMP-{1000 + numeric_part}",
        "baseSalary": "",
        "bonus": "",
        "stockOptions": "",
        "totalCompensation": "",
        "lastRevision": "",
        "nextReview": "",
        "avatarIndex": abs(hash(name)) % 8,
    }


def _build_recent_topics(interaction_memory: list[Any], fallback_text: str) -> list[str]:
    topics: list[str] = []
    for item in interaction_memory[-3:]:
        text = _summarize_topic(str(item))
        if text and text not in topics:
            topics.append(text)

    if not topics and fallback_text:
        topics.append(_summarize_topic(fallback_text))

    return topics


def sync_employees_to_firestore_from_twins(
    employee_names: list[str], transcript_text: str | None = None
) -> dict[str, Any]:
    """
    Sync processed employee metrics from Mongo digital twins to Firestore dashboard docs.

    Updates collections:
    - employee_profiles (creates minimal profile doc if missing)
    - employee_insights (sentiment, risk, behavioral, engagement, communication)
    """

    if not employee_names:
        return {"status": "no-op", "updated_count": 0, "details": []}

    if mongo_twins is None:
        return {
            "status": "disabled",
            "reason": "Mongo digital twin collection unavailable",
            "updated_count": 0,
            "details": [],
        }

    try:
        firestore_client = get_firestore_client()
    except Exception as exc:
        return {
            "status": "disabled",
            "reason": f"Firestore client unavailable: {exc}",
            "updated_count": 0,
            "details": [],
        }

    if firestore_client is None:
        return {
            "status": "disabled",
            "reason": "Firestore is not configured",
            "updated_count": 0,
            "details": [],
        }

    profile_collection, profile_index, max_numeric_id = _build_profile_index(firestore_client)
    insights_collection = firestore_client.collection("employee_insights")

    updated_count = 0
    details: list[dict[str, Any]] = []

    for raw_name in employee_names:
        name = str(raw_name or "").strip()
        if not name:
            continue

        twin = mongo_twins.find_one({"name": name})
        if not twin:
            twin = mongo_twins.find_one({
                "name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}
            })

        if not twin:
            details.append({"employee": name, "status": "skipped", "reason": "not found in Mongo"})
            continue

        profile_doc_id = profile_index.get(name.lower())
        if not profile_doc_id:
            max_numeric_id += 1
            profile_doc_id = str(max_numeric_id)
            profile_collection.document(profile_doc_id).set(
                _build_default_profile_doc(name, twin, profile_doc_id),
                merge=True,
            )
            profile_index[name.lower()] = profile_doc_id

        insight_ref = insights_collection.document(profile_doc_id)
        existing_snap = insight_ref.get()
        existing = existing_snap.to_dict() if existing_snap.exists else {}
        existing = _safe_dict(existing)

        interaction_memory = _safe_list(twin.get("interaction_memory"))
        latest_text = str(interaction_memory[-1]) if interaction_memory else str(transcript_text or "")

        sentiment_positive = predict_positive_sentiment(latest_text)
        sentiment_score = int(round(100 * clamp(sentiment_positive)))
        burnout_risk = _norm_01(twin.get("burnout_risk"), default=0.0)
        attrition_level = _risk_level_from_burnout(burnout_risk)

        behavioral_profile = _safe_dict(twin.get("behavioral_profile"))
        engagement_profile = _safe_dict(twin.get("engagement_profile"))
        herzberg = _safe_dict(twin.get("herzberg"))

        existing_behavioral = _safe_dict(existing.get("behavioral"))
        existing_communication = _safe_dict(existing.get("communication"))

        motivation_drivers = [
            str(x).strip() for x in _safe_list(behavioral_profile.get("motivation_drivers")) if str(x).strip()
        ]

        concerns = [
            str(x).strip() for x in _safe_list(herzberg.get("hygiene_issues")) if str(x).strip()
        ]
        if twin.get("equity_concerns") and "Fairness and equity concerns" not in concerns:
            concerns.append("Fairness and equity concerns")

        career_interests = [
            str(x).strip() for x in _safe_list(twin.get("career_goals")) if str(x).strip()
        ]

        communication = {
            "topTopics": _safe_list(engagement_profile.get("key_signals"))
            or _safe_list(existing_communication.get("topTopics")),
            "concernsRaised": concerns or _safe_list(existing_communication.get("concernsRaised")),
            "careerInterests": career_interests
            or _safe_list(existing_communication.get("careerInterests")),
            "recentTopics": _build_recent_topics(interaction_memory, latest_text)
            or _safe_list(existing_communication.get("recentTopics")),
        }

        sentiment_tag = _sentiment_label(sentiment_score)
        meetings_existing = _safe_list(existing.get("meetings"))
        meeting_item = {
            "date": datetime.utcnow().strftime("%B %Y"),
            "topic": _summarize_topic(latest_text),
            "sentiment": sentiment_tag,
            "color": _sentiment_color(sentiment_tag),
        }

        meetings = [meeting_item] + [
            row for row in meetings_existing
            if isinstance(row, dict) and not (
                str(row.get("date", "")) == meeting_item["date"]
                and str(row.get("topic", "")) == meeting_item["topic"]
            )
        ]

        payload = {
            "sentiment": sentiment_score,
            "risk": attrition_level,
            "positiveNegative": f"{sentiment_score}/{100 - sentiment_score}",
            "sentimentTrend": _update_sentiment_trend(
                _safe_list(existing.get("sentimentTrend")), sentiment_score
            ),
            "behavioral": {
                "communicationStyle": behavioral_profile.get("communication_style")
                or existing_behavioral.get("communicationStyle", "Balanced"),
                "personalityTraits": behavioral_profile.get("personality_summary")
                or existing_behavioral.get("personalityTraits", "Not enough data"),
                "motivationDrivers": ", ".join(motivation_drivers)
                or existing_behavioral.get("motivationDrivers", "Not enough data"),
                "feedbackPreference": behavioral_profile.get("feedback_preference")
                or existing_behavioral.get("feedbackPreference", "Constructive"),
                "collaborationStyle": behavioral_profile.get("collaboration_style")
                or existing_behavioral.get("collaborationStyle", "Collaborative"),
            },
            "engagementMetrics": _build_engagement_metrics(engagement_profile),
            "communication": communication,
            "meetings": meetings[:6],
            "riskIndicators": _build_risk_indicators(
                burnout_risk=burnout_risk,
                attrition_level=attrition_level,
                engagement_profile=engagement_profile,
            ),
            "updatedAt": datetime.utcnow().isoformat(),
        }

        insight_ref.set(payload, merge=True)

        updated_count += 1
        details.append(
            {
                "employee": name,
                "profile_doc_id": profile_doc_id,
                "status": "updated",
                "sentiment": sentiment_score,
                "risk": attrition_level,
            }
        )

    return {
        "status": "success",
        "updated_count": updated_count,
        "details": details,
    }
