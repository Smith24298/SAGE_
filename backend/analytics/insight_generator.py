"""LLM insight generation and panel-shape formatting for AI Insights dashboards."""

from __future__ import annotations

import json
from typing import Any

from backend.ai.llm import llm


ROLE_GUIDANCE = {
    "cxo": "Focus on organizational health, strategic risks, and cross-department priorities.",
    "chro": "Focus on organizational health, strategic risks, and cross-department priorities.",
    "hr": "Focus on engagement trends, burnout alerts, and retention interventions.",
    "hr_partner": "Focus on engagement trends, burnout alerts, and retention interventions.",
    "manager": "Focus on team performance, motivation signals, and near-term action plans.",
    "engagement_manager": "Focus on team performance, motivation signals, and near-term action plans.",
    "employee": "Focus on personal growth, wellbeing signals, and practical development actions.",
    "talent_ops": "Focus on skill pipelines, mobility trends, and talent capacity planning.",
}


def normalize_role(role: str | None) -> str:
    raw = (role or "").strip().lower()
    synonyms = {
        "ceo": "cxo",
        "cfo": "cxo",
        "coo": "cxo",
        "cxo": "cxo",
        "chief": "cxo",
        "hr": "hr",
        "hrbp": "hr_partner",
        "manager": "manager",
        "employee": "employee",
    }
    if raw in ROLE_GUIDANCE:
        return raw
    return synonyms.get(raw, "cxo")


def _extract_json(content: str) -> dict[str, Any]:
    text = (content or "").strip()
    if text.startswith("```json"):
        text = text[7:-3].strip()
    elif text.startswith("```"):
        text = text[3:-3].strip()
    return json.loads(text)


def _fallback_insights(analytics_data: dict[str, Any], role: str, department: str | None) -> dict[str, Any]:
    global_metrics = analytics_data.get("global_metrics", {})
    total = analytics_data.get("employee_count", 0)
    engagement = round(100 * float(global_metrics.get("engagement", 0.0)), 1)
    burnout = round(100 * float(global_metrics.get("burnout_risk", 0.0)), 1)
    health = round(100 * float(global_metrics.get("health_score", 0.0)), 1)

    scope = department or "all departments"
    return {
        "summary": (
            f"Analytics for {scope} across {total} employees show health at {health}%, "
            f"engagement at {engagement}%, and burnout risk at {burnout}%."
        ),
        "key_observations": [
            f"Engagement score is {engagement}% based on participation, responsiveness, and initiative.",
            f"Burnout risk is {burnout}% based on sentiment and workload/stress signals.",
            "Behavioral and engagement signals are sourced from both Firestore and Mongo digital twins.",
        ],
        "potential_risks": [
            "Elevated burnout clusters may increase attrition risk if not addressed early.",
            "Low participation pockets can reduce team execution speed and morale.",
        ],
        "positive_signals": [
            "Responsive teams and positive sentiment pockets indicate strong leadership potential.",
            "Motivation-driver patterns can be used for targeted development plans.",
        ],
        "leadership_recommendations": [
            "Run manager-level workload balancing for the highest-risk teams within 2 weeks.",
            "Launch role-specific engagement actions and monitor shifts weekly.",
            f"Tailor communications and coaching for the {role.upper()} audience.",
        ],
    }


def generate_structured_insights(
    *, analytics_data: dict[str, Any], role: str, department: str | None
) -> dict[str, Any]:
    normalized_role = normalize_role(role)
    role_instruction = ROLE_GUIDANCE.get(normalized_role, ROLE_GUIDANCE["cxo"])

    prompt = f"""
You are an Organizational Intelligence AI designed to help HR leaders and managers understand workforce behavior.

You will be given structured analytics about a team or department.

Your task is to analyze the data and generate meaningful leadership insights.

Focus on:
1. Team health and morale
2. Burnout risks
3. Motivation patterns
4. Behavioral signals
5. Leadership recommendations

Input data:
{json.dumps(analytics_data, indent=2)}

Audience role: {normalized_role}
Department filter: {department or "all"}
Role-specific guidance: {role_instruction}

Instructions:
- Interpret the metrics carefully.
- Identify key risks and opportunities.
- Explain why patterns might be occurring.
- Suggest practical leadership actions.
- Interpret analytics only (do not use raw transcript quotes).

Return the response as valid JSON only:
{{
  "summary": "",
  "key_observations": [],
  "potential_risks": [],
  "positive_signals": [],
  "leadership_recommendations": []
}}
"""

    try:
        response = llm.invoke(prompt)
        parsed = _extract_json(getattr(response, "content", ""))
        return {
            "summary": str(parsed.get("summary", "")).strip(),
            "key_observations": [str(x) for x in parsed.get("key_observations", [])],
            "potential_risks": [str(x) for x in parsed.get("potential_risks", [])],
            "positive_signals": [str(x) for x in parsed.get("positive_signals", [])],
            "leadership_recommendations": [
                str(x) for x in parsed.get("leadership_recommendations", [])
            ],
        }
    except Exception as exc:
        print(f"[analytics] LLM insight generation fallback: {exc}")
        return _fallback_insights(analytics_data, normalized_role, department)


def build_panel_payload(insights: dict[str, Any], analytics_data: dict[str, Any]) -> dict[str, Any]:
    """Shape insights for the existing AI Insights dashboard sections."""
    risks = [str(x) for x in insights.get("potential_risks", [])]
    positives = [str(x) for x in insights.get("positive_signals", [])]
    observations = [str(x) for x in insights.get("key_observations", [])]
    recommendations = [str(x) for x in insights.get("leadership_recommendations", [])]

    priorities = recommendations[:3] if recommendations else risks[:3]

    global_metrics = analytics_data.get("global_metrics", {})
    burnout = float(global_metrics.get("burnout_risk", 0.0))
    engagement = float(global_metrics.get("engagement", 0.0))
    sentiment = float(global_metrics.get("avg_sentiment", global_metrics.get("sentiment", 0.0)))
    count = int(analytics_data.get("employee_count", 0))

    if count <= 0:
        return {
            "priority_actions": priorities,
            "sections": [
                {"category": "Attrition Risk", "items": risks[:3]},
                {"category": "Engagement Opportunities", "items": positives[:3]},
                {"category": "Talent Development", "items": observations[:3]},
                {"category": "Strategic Recommendations", "items": recommendations[:3]},
            ],
            "predictive_analytics": {
                "predicted_turnover_pct": 0.0,
                "recommended_new_hires": 0,
                "projected_engagement_pct": 0.0,
            },
        }

    predicted_turnover = max(0.0, min(100.0, 100.0 * (0.55 * burnout + 0.3 * (1 - engagement) + 0.15 * (1 - sentiment))))
    projected_engagement = max(0.0, min(100.0, 100.0 * min(1.0, engagement + 0.05 * (1 - burnout))))
    recommended_hires = max(0, round(count * max(0.0, predicted_turnover / 100.0 - 0.05)))

    return {
        "priority_actions": priorities,
        "sections": [
            {"category": "Attrition Risk", "items": risks[:3]},
            {"category": "Engagement Opportunities", "items": positives[:3]},
            {"category": "Talent Development", "items": observations[:3]},
            {"category": "Strategic Recommendations", "items": recommendations[:3]},
        ],
        "predictive_analytics": {
            "predicted_turnover_pct": round(predicted_turnover, 1),
            "recommended_new_hires": int(recommended_hires),
            "projected_engagement_pct": round(projected_engagement, 1),
        },
    }
