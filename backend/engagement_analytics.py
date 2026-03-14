"""Mongo-backed engagement analytics payload for Engagement Manager dashboard."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

from backend.database import db, employees


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _clamp_pct(value: float) -> float:
    if value != value:  # NaN
        return 0.0
    return max(0.0, min(100.0, value))


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

    if text.endswith("Z"):
        text = text[:-1]
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def _safe_collection(name: str):
    if db is None:
        raise RuntimeError("Database connection not available")
    return db[name]


def _build_trend_from_meetings(limit_docs: int = 400, months: int = 7) -> list[dict[str, Any]]:
    meetings = list(
        _safe_collection("meeting_summaries")
        .find({})
        .sort("created_at", -1)
        .limit(max(1, limit_docs))
    )

    buckets: dict[str, list[float]] = defaultdict(list)
    for doc in meetings:
        dt = _parse_date(doc.get("created_at")) or _parse_date(doc.get("date"))
        if dt is None:
            continue

        score = _to_float(doc.get("avgSentiment", doc.get("sentiment")), default=-1.0)
        if score < 0:
            continue

        key = dt.strftime("%Y-%m")
        buckets[key].append(score)

    if not buckets:
        return []

    points: list[dict[str, Any]] = []
    for key in sorted(buckets.keys())[-months:]:
        month_dt = datetime.strptime(f"{key}-01", "%Y-%m-%d")
        values = buckets[key]
        avg = sum(values) / len(values)
        points.append({"month": month_dt.strftime("%b"), "score": round(_clamp_pct(avg), 1)})

    return points


def _build_trend_from_insights(months: int = 7) -> list[dict[str, Any]]:
    insights = list(_safe_collection("employee_insights").find({}, {"_id": 0}))

    month_scores: dict[str, list[float]] = defaultdict(list)
    for doc in insights:
        trend = doc.get("sentimentTrend")
        if not isinstance(trend, list):
            continue
        for point in trend:
            if not isinstance(point, dict):
                continue
            month = str(point.get("month") or "").strip()
            if not month:
                continue
            score = _to_float(point.get("score"), default=-1.0)
            if score < 0:
                continue
            month_scores[month].append(score)

    if not month_scores:
        return []

    month_order = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    points: list[dict[str, Any]] = []
    for m in month_order:
        values = month_scores.get(m)
        if not values:
            continue
        avg = sum(values) / len(values)
        points.append({"month": m, "score": round(_clamp_pct(avg), 1)})

    return points[-months:]


def _avg_metric(insights: list[dict[str, Any]], metric_name: str) -> float | None:
    vals: list[float] = []
    for doc in insights:
        metrics = doc.get("engagementMetrics")
        if not isinstance(metrics, list):
            continue
        for m in metrics:
            if not isinstance(m, dict):
                continue
            if str(m.get("metric") or "").strip().lower() != metric_name.lower():
                continue
            score = _to_float(m.get("score"), default=-1.0)
            if score >= 0:
                vals.append(score)
    if not vals:
        return None
    return sum(vals) / len(vals)


def build_engagement_analytics() -> dict[str, Any]:
    """Return payload for Engagement Analytics page.

    Uses employee insights + meeting summaries already stored by the app.
    """

    insights = list(_safe_collection("employee_insights").find({}, {"_id": 0}))
    total = len(insights)

    sentiment_vals: list[float] = []
    high_count = 0
    at_risk_count = 0

    for doc in insights:
        sentiment = _to_float(doc.get("sentiment"), default=-1.0)
        if sentiment >= 0:
            sentiment_vals.append(sentiment)
            if sentiment >= 80:
                high_count += 1
        risk = str(doc.get("risk") or "").strip().lower()
        if risk == "high":
            at_risk_count += 1

    overall_engagement = round(_clamp_pct(sum(sentiment_vals) / len(sentiment_vals)) if sentiment_vals else 0.0, 1)
    highly_engaged_pct = round((high_count / max(total, 1)) * 100.0, 1)
    at_risk_pct = round((at_risk_count / max(total, 1)) * 100.0, 1)

    trend = _build_trend_from_meetings(months=7)
    if not trend:
        trend = _build_trend_from_insights(months=7)

    # Factors: keep the existing UI labels, but derive values from stored signals when possible.
    # - Work-Life Balance: inverse burnout risk from digital twins, if present.
    work_life = None
    try:
        if employees is not None:
            docs = list(employees.find({}, {"_id": 0, "burnout_risk": 1}).limit(500))
            vals = [_to_float(d.get("burnout_risk"), default=-1.0) for d in docs]
            vals = [v for v in vals if v >= 0]
            if vals:
                avg_burnout = sum(vals) / len(vals)
                work_life = round(_clamp_pct(100.0 - (avg_burnout * 100.0)), 1)
    except Exception:
        work_life = None

    # EngagementMetrics-derived components
    participation = _avg_metric(insights, "Participation")
    responsiveness = _avg_metric(insights, "Responsiveness")
    initiative = _avg_metric(insights, "Initiative")

    # Map available signals onto the existing factor labels.
    factors = [
        {"factor": "Work-Life Balance", "score": work_life if work_life is not None else overall_engagement},
        {"factor": "Career Growth", "score": round(_clamp_pct(initiative if initiative is not None else overall_engagement), 1)},
        {"factor": "Recognition", "score": round(_clamp_pct(overall_engagement), 1)},
        {"factor": "Team Culture", "score": round(_clamp_pct(participation if participation is not None else overall_engagement), 1)},
        {"factor": "Management", "score": round(_clamp_pct(responsiveness if responsiveness is not None else overall_engagement), 1)},
        {"factor": "Compensation", "score": round(_clamp_pct(overall_engagement), 1)},
    ]

    return {
        "kpis": {
            "overallEngagementPct": overall_engagement,
            "highlyEngagedPct": highly_engaged_pct,
            "atRiskPct": at_risk_pct,
        },
        "engagementTrend": trend,
        "engagementFactors": factors,
        "totalEmployees": _to_int(total, 0),
    }
