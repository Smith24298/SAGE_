"""Cross-database analytics engine for AI + ML insights generation."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from backend.database import db as mongo_db
from backend.database import employees as mongo_twins
from backend.firebase_admin import get_firestore_client

from .aggregation_service import aggregate_all
from .insight_generator import build_panel_payload, generate_structured_insights, normalize_role
from .prediction_models import (
    burnout_risk_score,
    engagement_score,
    estimate_equity_score,
    estimate_stress_signal,
    estimate_workload_signal,
    normalize_sentiment,
    organizational_health_score,
    parse_engagement_components,
    predict_negative_sentiment,
)


def _safe_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _safe_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _load_firestore_data() -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    try:
        fs = get_firestore_client()
    except Exception as exc:
        print(f"[analytics] Firestore client unavailable: {exc}")
        return {}, {}

    if fs is None:
        return {}, {}

    try:
        profiles = {
            doc.id: (doc.to_dict() or {})
            for doc in fs.collection("employee_profiles").stream()
        }
        insights = {
            doc.id: (doc.to_dict() or {})
            for doc in fs.collection("employee_insights").stream()
        }
        return profiles, insights
    except Exception as exc:
        print(f"[analytics] Firestore read failed: {exc}")
        return {}, {}


def _load_mongo_twins() -> dict[str, dict[str, Any]]:
    if mongo_twins is None:
        return {}

    try:
        twins_map: dict[str, dict[str, Any]] = {}
        for twin in mongo_twins.find():
            name = str(twin.get("name", "")).strip().lower()
            if name:
                twins_map[name] = twin
        return twins_map
    except Exception as exc:
        print(f"[analytics] Mongo twin read failed: {exc}")
        return {}


def _load_latest_intelligence_reports() -> dict[str, dict[str, Any]]:
    if mongo_db is None:
        return {}

    try:
        collection = mongo_db["intelligence_reports"]
    except Exception:
        return {}

    latest: dict[str, dict[str, Any]] = {}
    try:
        cursor = collection.find().sort("created_at", -1)
        for report in cursor:
            employee = str(report.get("employee", "")).strip().lower()
            if not employee or employee in latest:
                continue
            latest[employee] = report
    except Exception as exc:
        print(f"[analytics] Mongo intelligence read failed: {exc}")

    return latest


def _extract_motivation_signals(
    insight_doc: dict[str, Any],
    twin_doc: dict[str, Any],
    intelligence_doc: dict[str, Any],
) -> list[str]:
    signals: list[str] = []

    behavioral_fs = _safe_dict(insight_doc.get("behavioral"))
    raw = behavioral_fs.get("motivationDrivers")
    if isinstance(raw, str) and raw.strip():
        parts = [x.strip() for x in raw.split(",") if x.strip()]
        signals.extend(parts)

    behavioral_twin = _safe_dict(twin_doc.get("behavioral_profile"))
    signals.extend(str(x) for x in _safe_list(behavioral_twin.get("motivation_drivers")) if x)

    behavioral_report = _safe_dict(intelligence_doc.get("behavioral_intelligence"))
    signals.extend(str(x) for x in _safe_list(behavioral_report.get("motivation_drivers")) if x)

    # Preserve order while de-duplicating.
    seen: set[str] = set()
    unique: list[str] = []
    for signal in signals:
        key = signal.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(signal.strip())

    return unique


def _compute_employee_record(
    *,
    doc_id: str,
    profile: dict[str, Any],
    insight: dict[str, Any],
    twin: dict[str, Any],
    intelligence: dict[str, Any],
) -> dict[str, Any]:
    name = str(profile.get("name") or twin.get("name") or f"Employee-{doc_id}").strip()
    department = str(profile.get("department") or "Unknown").strip() or "Unknown"
    role = str(profile.get("role") or "Unknown").strip() or "Unknown"
    team = str(profile.get("manager") or "Unassigned").strip() or "Unassigned"

    # Sentiment (prefer existing computed metrics).
    sentiment_raw = insight.get("sentiment")
    sentiment = normalize_sentiment(sentiment_raw)

    engagement_profile = _safe_dict(twin.get("engagement_profile"))
    intelligence_engagement = _safe_dict(intelligence.get("engagement_intelligence"))

    merged_engagement_profile = {
        **engagement_profile,
        **{k: v for k, v in intelligence_engagement.items() if v is not None},
    }

    engagement_metrics = _safe_list(insight.get("engagementMetrics"))
    participation, responsiveness, initiative = parse_engagement_components(
        merged_engagement_profile,
        engagement_metrics,
    )

    engagement = engagement_score(participation, responsiveness, initiative)

    communication = _safe_dict(insight.get("communication"))
    concerns = _safe_list(communication.get("concernsRaised"))
    interaction_memory = _safe_list(twin.get("interaction_memory"))
    text_corpus = concerns + interaction_memory

    if sentiment_raw is None:
        sentiment_text = " ".join(str(x) for x in text_corpus if x)
        sentiment = max(sentiment, 1.0 - predict_negative_sentiment(sentiment_text))

    negative_sentiment = max(0.0, min(1.0, 1.0 - sentiment))

    risk_indicators = _safe_list(insight.get("riskIndicators"))
    risk_levels = [
        _safe_dict(item).get("level") for item in risk_indicators if isinstance(item, dict)
    ]

    burnout_hint = _to_float(twin.get("burnout_risk"), default=0.0)

    workload_signal = estimate_workload_signal(text_corpus)
    stress_signal = estimate_stress_signal(text_corpus, risk_levels, burnout_hint)
    burnout = burnout_risk_score(negative_sentiment, workload_signal, stress_signal)

    equity_concerns = bool(twin.get("equity_concerns", False))
    personality_summary = _safe_dict(intelligence.get("behavioral_intelligence")).get(
        "personality_summary"
    )
    hygiene_issues = _safe_list(_safe_dict(twin.get("herzberg")).get("hygiene_issues"))
    fairness_sources = concerns + interaction_memory + hygiene_issues
    if isinstance(personality_summary, str) and personality_summary.strip():
        fairness_sources.append(personality_summary)
    equity_score = estimate_equity_score(equity_concerns, fairness_sources)

    health_score = organizational_health_score(
        sentiment=sentiment,
        engagement=engagement,
        burnout_risk=burnout,
        equity_score=equity_score,
    )

    return {
        "id": doc_id,
        "name": name,
        "department": department,
        "role": role,
        "team": team,
        "sentiment": round(sentiment, 4),
        "participation": round(participation, 4),
        "responsiveness": round(responsiveness, 4),
        "initiative": round(initiative, 4),
        "engagement": round(engagement, 4),
        "negative_sentiment": round(negative_sentiment, 4),
        "workload_signals": round(workload_signal, 4),
        "stress_signals": round(stress_signal, 4),
        "burnout_risk": round(burnout, 4),
        "equity_score": round(equity_score, 4),
        "health_score": round(health_score, 4),
        "motivation_signals": _extract_motivation_signals(insight, twin, intelligence),
    }


def _collect_employee_records(department_filter: str | None) -> list[dict[str, Any]]:
    profiles, insights_docs = _load_firestore_data()
    twins = _load_mongo_twins()
    latest_reports = _load_latest_intelligence_reports()

    records: list[dict[str, Any]] = []
    known_names: set[str] = set()

    for doc_id, profile in profiles.items():
        insight = insights_docs.get(doc_id, {})
        name_key = str(profile.get("name", "")).strip().lower()
        twin = twins.get(name_key, {})
        intelligence = latest_reports.get(name_key, {})

        record = _compute_employee_record(
            doc_id=doc_id,
            profile=profile,
            insight=insight,
            twin=twin,
            intelligence=intelligence,
        )

        if department_filter and record["department"].lower() != department_filter.lower():
            continue

        records.append(record)
        if name_key:
            known_names.add(name_key)

    # Include Mongo-only employees not yet present in Firestore.
    for name_key, twin in twins.items():
        if name_key in known_names:
            continue

        synthetic_profile = {
            "name": twin.get("name") or name_key.title(),
            "department": "Unknown",
            "role": "Unknown",
            "manager": "Unassigned",
        }
        intelligence = latest_reports.get(name_key, {})

        record = _compute_employee_record(
            doc_id=name_key,
            profile=synthetic_profile,
            insight={},
            twin=twin,
            intelligence=intelligence,
        )

        if department_filter and record["department"].lower() != department_filter.lower():
            continue

        records.append(record)

    return records


def _top_risks(records: list[dict[str, Any]], top_n: int = 5) -> list[dict[str, Any]]:
    ranked = sorted(records, key=lambda r: (-float(r.get("burnout_risk", 0.0)), r.get("name", "")))
    return [
        {
            "name": item.get("name"),
            "department": item.get("department"),
            "burnout_risk": item.get("burnout_risk"),
            "engagement": item.get("engagement"),
            "sentiment": item.get("sentiment"),
        }
        for item in ranked[:top_n]
    ]


def build_analytics_payload(department: str | None = None) -> dict[str, Any]:
    records = _collect_employee_records(department)
    aggregations = aggregate_all(records)

    global_metrics = aggregations.get("global", {})
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "employee_count": len(records),
        "department_filter": department,
        "global_metrics": global_metrics,
        "aggregations": {
            "department": aggregations.get("department", {}),
            "role": aggregations.get("role", {}),
            "team": aggregations.get("team", {}),
        },
        "top_risks": _top_risks(records),
        "employee_metrics": records,
    }
    return payload


def generate_ai_insights(role: str, department: str | None = None) -> dict[str, Any]:
    normalized_role = normalize_role(role)
    analytics_data = build_analytics_payload(department)

    insights = generate_structured_insights(
        analytics_data=analytics_data,
        role=normalized_role,
        department=department,
    )

    panel_payload = build_panel_payload(insights, analytics_data)

    return {
        "summary": insights.get("summary", ""),
        "key_observations": insights.get("key_observations", []),
        "potential_risks": insights.get("potential_risks", []),
        "positive_signals": insights.get("positive_signals", []),
        "leadership_recommendations": insights.get("leadership_recommendations", []),
        "panel": panel_payload,
        "context": {
            "role": normalized_role,
            "department": department,
            "generated_at": analytics_data.get("generated_at"),
            "employee_count": analytics_data.get("employee_count", 0),
        },
        "analytics_snapshot": {
            "global_metrics": analytics_data.get("global_metrics", {}),
            "aggregations": analytics_data.get("aggregations", {}),
            "top_risks": analytics_data.get("top_risks", []),
        },
    }
