"""Mongo-backed CHRO dashboard analytics payload builder."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

from backend.database import db


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_date(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value

    text = str(value or "").strip()
    if not text:
        return None

    for fmt in (
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%b %d, %Y",
        "%B %d, %Y",
    ):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue

    # Last resort: handle basic ISO timestamps with timezone marker
    if text.endswith("Z"):
        text = text[:-1]
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def _normalize_risk(value: Any) -> str:
    risk = str(value or "").strip().lower()
    if risk == "high":
        return "High"
    if risk == "medium":
        return "Medium"
    return "Low"


def _avg(values: list[float], default: float = 0.0) -> float:
    if not values:
        return default
    return sum(values) / len(values)


def _format_pct(value: float) -> float:
    return round(value, 1)


def _build_sentiment_trend_from_meetings(meeting_docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: dict[str, list[float]] = defaultdict(list)

    for doc in meeting_docs:
        dt = _parse_date(doc.get("created_at")) or _parse_date(doc.get("date"))
        if dt is None:
            continue

        score_raw = doc.get("avgSentiment", doc.get("sentiment"))
        score = _to_float(score_raw, default=-1.0)
        if score < 0:
            continue

        key = dt.strftime("%Y-%m")
        buckets[key].append(score)

    if not buckets:
        return []

    trend: list[dict[str, Any]] = []
    for key in sorted(buckets.keys())[-6:]:
        month_dt = datetime.strptime(f"{key}-01", "%Y-%m-%d")
        trend.append(
            {
                "month": month_dt.strftime("%b"),
                "score": _format_pct(_avg(buckets[key], default=0.0)),
            }
        )
    return trend


def _build_sentiment_trend_from_insights(insight_docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    month_scores: dict[str, list[float]] = defaultdict(list)

    for doc in insight_docs:
        trend = doc.get("sentimentTrend")
        if not isinstance(trend, list):
            continue

        for point in trend:
            if not isinstance(point, dict):
                continue
            month = str(point.get("month", "")).strip()
            if not month:
                continue
            score = _to_float(point.get("score"), default=-1.0)
            if score < 0:
                continue
            month_scores[month].append(score)

    month_order = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    result: list[dict[str, Any]] = []
    for month in month_order:
        values = month_scores.get(month)
        if not values:
            continue
        result.append({"month": month, "score": _format_pct(_avg(values, default=0.0))})

    return result[-6:]


def _safe_collection(name: str):
    if db is None:
        raise RuntimeError("Database connection not available")
    return db[name]


def build_dashboard_overview() -> dict[str, Any]:
    profiles_collection = _safe_collection("employee_profiles")
    insights_collection = _safe_collection("employee_insights")
    meetings_collection = _safe_collection("meeting_summaries")

    profiles = list(profiles_collection.find({}, {"_id": 0}))
    insights = list(insights_collection.find({}, {"_id": 0}))
    meetings = list(meetings_collection.find({}).sort("created_at", -1).limit(300))

    total_employees = len(profiles)

    insights_by_employee_id: dict[str, dict[str, Any]] = {}
    for doc in insights:
        employee_id = str(doc.get("employeeId", "")).strip()
        if employee_id:
            insights_by_employee_id[employee_id] = doc

    sentiment_scores: list[float] = []
    risk_counts = {"Low": 0, "Medium": 0, "High": 0}

    for insight in insights:
        score = _to_float(insight.get("sentiment"), default=-1.0)
        if score >= 0:
            sentiment_scores.append(score)

        risk = _normalize_risk(insight.get("risk"))
        risk_counts[risk] += 1

    company_engagement = _format_pct(_avg(sentiment_scores, default=70.0))
    high_risk_pct = _format_pct((risk_counts["High"] / max(total_employees, 1)) * 100.0)

    join_buckets: dict[str, int] = defaultdict(int)
    for profile in profiles:
        joined = _parse_date(profile.get("dateOfJoining"))
        if joined is None:
            continue
        join_buckets[joined.strftime("%Y-%m")] += 1

    workforce_growth = 0.0
    if join_buckets:
        sorted_months = sorted(join_buckets.keys())
        latest_month = sorted_months[-1]
        latest_count = join_buckets[latest_month]
        prev_count = join_buckets[sorted_months[-2]] if len(sorted_months) > 1 else 0
        workforce_growth = _format_pct(((latest_count - prev_count) / max(prev_count, 1)) * 100.0)

    dept_to_scores: dict[str, list[float]] = defaultdict(list)
    for profile in profiles:
        department = str(profile.get("department") or "Unknown").strip() or "Unknown"
        employee_ref = str(profile.get("id") or profile.get("employeeId") or "").strip()
        insight = insights_by_employee_id.get(employee_ref, {})
        score = _to_float(insight.get("sentiment"), default=70.0)
        score = max(0.0, min(100.0, score))
        dept_to_scores[department].append(score)

    department_stress_engagement: list[dict[str, Any]] = []
    for department in sorted(dept_to_scores.keys(), key=str.lower):
        engagement = _format_pct(_avg(dept_to_scores[department], default=70.0))
        stress = _format_pct(max(0.0, 100.0 - engagement))
        department_stress_engagement.append(
            {
                "department": department,
                "stress": stress,
                "engagement": engagement,
            }
        )

    total_risk_count = max(sum(risk_counts.values()), 1)
    attrition_prediction = [
        {"name": "Low Risk", "value": _format_pct((risk_counts["Low"] / total_risk_count) * 100.0)},
        {"name": "Medium Risk", "value": _format_pct((risk_counts["Medium"] / total_risk_count) * 100.0)},
        {"name": "High Risk", "value": _format_pct((risk_counts["High"] / total_risk_count) * 100.0)},
    ]

    sentiment_trend = _build_sentiment_trend_from_meetings(meetings)
    if not sentiment_trend:
        sentiment_trend = _build_sentiment_trend_from_insights(insights)

    latest_meeting = meetings[0] if meetings else None
    if latest_meeting:
        latest_date = latest_meeting.get("date")
        attendees = latest_meeting.get("attendees", 0)
        topics = latest_meeting.get("topics")
        if not isinstance(topics, list):
            topics = []
        summary_sentence = (
            f"Latest meeting ({latest_date or 'recent'}) had {attendees} participants and covered "
            f"{', '.join(str(t) for t in topics[:3]) or 'key organization topics'}."
        )
    else:
        summary_sentence = (
            f"Current organization sentiment is {company_engagement:.1f}% across {total_employees} employees."
        )

    if company_engagement < 70:
        recommendation = "Prioritize manager check-ins and targeted pulse surveys for low-sentiment departments."
    elif high_risk_pct >= 20:
        recommendation = "Focus on high-risk employees with workload balancing and retention interventions."
    else:
        recommendation = "Maintain current engagement cadence and continue monthly sentiment monitoring."

    return {
        "metrics": {
            "totalEmployees": total_employees,
            "companyEngagement": company_engagement,
            "attritionRisk": high_risk_pct,
            "workforceGrowth": workforce_growth,
        },
        "sentimentTrend": sentiment_trend,
        "departmentStressEngagement": department_stress_engagement,
        "attritionPrediction": attrition_prediction,
        "strategicInsight": {
            "latestInsight": summary_sentence,
            "recommendation": recommendation,
        },
    }
