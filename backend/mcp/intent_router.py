"""Intent routing for HR/OB-specialized chat and navigation."""

from __future__ import annotations

import json
import time
from dataclasses import dataclass

from backend.ai.llm import llm
from backend.database import employees
from backend.mcp.navigation_resolver import navigation_reply_text, resolve_navigation
from backend.rag.hr_assistant import hr_chat

MEETING_HR_MODE = "meeting_hr"
OUT_OF_SCOPE_MODE = "out_of_scope"
NAVIGATION_MODE = "navigation"

HR_KEYWORDS = {
    "meeting",
    "meetings",
    "transcript",
    "transcripts",
    "employee",
    "employees",
    "hr",
    "manager",
    "team",
    "1:1",
    "one-on-one",
    "digital twin",
    "digital twins",
    "sentiment",
    "engagement",
    "burnout",
    "attrition",
    "retention",
    "promotion",
    "performance",
    "feedback",
    "workforce",
    "workload",
    "wellbeing",
    "morale",
    "behavior",
    "behaviour",
    "concern",
    "concerns",
    "risk",
    "risks",
    "insight",
    "insights",
    "action item",
    "action items",
    "summary",
    "summarize",
    "summarise",
    "database",
    "db",
    "personalized",
    "personalised",
    "what did",
    "last meeting",
    "one on one",
}

CASUAL_HINTS = {
    "weather",
    "capital of",
    "joke",
    "poem",
    "recipe",
    "movie",
    "music",
    "photosynthesis",
    "quantum",
    "planet",
    "history",
    "math",
    "programming",
    "javascript",
    "python",
    "football",
    "cricket",
}

OUT_OF_SCOPE_CAPABILITIES_REPLY = (
    "I am an HR/OB-focused assistant and cannot help with that topic.\n\n"
    "I can help with:\n"
    "- Meeting prep using employee context\n"
    "- Employee behavioral insights from digital twins\n"
    "- Engagement, burnout, and attrition risk analysis\n"
    "- Actionable HR recommendations from database-backed signals\n\n"
    "Ask a relevant HR question, for example: 'Prepare me for a 1:1 with Emily Rodriguez'."
)

_EMPLOYEE_NAME_CACHE: dict[str, object] = {
    "expires_at": 0.0,
    "names": [],
}


@dataclass
class IntentDecision:
    mode: str
    confidence: float
    reason: str
    source: str

    def to_dict(self) -> dict:
        return {
            "mode": self.mode,
            "confidence": round(max(0.0, min(1.0, float(self.confidence))), 3),
            "reason": self.reason,
            "source": self.source,
        }


def _normalize(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _strip_code_fence(text: str) -> str:
    content = (text or "").strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()


def _hits(text: str, keywords: set[str]) -> list[str]:
    matched = [keyword for keyword in keywords if keyword in text]
    return sorted(set(matched), key=lambda x: (len(x), x))


def _get_employee_names_cached() -> list[str]:
    now = time.time()
    expires_at = float(_EMPLOYEE_NAME_CACHE.get("expires_at", 0.0))
    cached_names = _EMPLOYEE_NAME_CACHE.get("names", [])
    if now < expires_at and isinstance(cached_names, list):
        return [str(name) for name in cached_names]

    if employees is None:
        _EMPLOYEE_NAME_CACHE["expires_at"] = now + 30
        _EMPLOYEE_NAME_CACHE["names"] = []
        return []

    try:
        docs = employees.find({}, {"name": 1}).limit(500)
        names = []
        for doc in docs:
            value = str(doc.get("name", "")).strip().lower()
            if value:
                names.append(value)

        deduped = sorted(set(names))
        _EMPLOYEE_NAME_CACHE["expires_at"] = now + 120
        _EMPLOYEE_NAME_CACHE["names"] = deduped
        return deduped
    except Exception:
        return [str(name) for name in cached_names] if isinstance(cached_names, list) else []


def _employee_name_hits(text: str) -> list[str]:
    names = _get_employee_names_cached()
    if not names:
        return []
    return [name for name in names if len(name) >= 3 and name in text][:5]


def _llm_classify(question: str) -> IntentDecision:
    prompt = f"""
Classify this user message into exactly one mode:
- "navigation": user wants to open/go to a product page or profile.
- "meeting_hr": about meetings, employees, HR analytics, transcripts, workplace behavior, engagement, management, digital twins.
- "out_of_scope": non-HR requests (general knowledge, entertainment, weather, coding, etc.)

Return ONLY strict JSON:
{{"mode":"navigation|meeting_hr|out_of_scope","confidence":0.0,"reason":"short reason"}}

Message:
{question}
"""

    try:
        response = llm.invoke(prompt)
        raw = getattr(response, "content", "")
        data = json.loads(_strip_code_fence(str(raw)))

        mode = str(data.get("mode", "")).strip().lower()
        if mode not in {NAVIGATION_MODE, MEETING_HR_MODE, OUT_OF_SCOPE_MODE}:
            mode = OUT_OF_SCOPE_MODE

        confidence = float(data.get("confidence", 0.6))
        reason = str(data.get("reason", "LLM classified this message."))

        return IntentDecision(
            mode=mode,
            confidence=max(0.0, min(1.0, confidence)),
            reason=reason,
            source="llm",
        )
    except Exception as exc:
        return IntentDecision(
            mode=MEETING_HR_MODE,
            confidence=0.58,
            reason=f"LLM classification fallback; defaulted to HR-safe routing: {exc}",
            source="fallback",
        )


def classify_intent(question: str) -> IntentDecision:
    text = _normalize(question)
    if not text:
        return IntentDecision(
            mode=OUT_OF_SCOPE_MODE,
            confidence=0.98,
            reason="Empty question routed to capability guidance.",
            source="heuristic",
        )

    navigation = resolve_navigation(question)
    if navigation is not None:
        return IntentDecision(
            mode=NAVIGATION_MODE,
            confidence=max(0.82, navigation.confidence),
            reason=navigation.reason,
            source="navigation-resolver",
        )

    if "digital twin" in text or "digital twins" in text:
        return IntentDecision(
            mode=MEETING_HR_MODE,
            confidence=0.94,
            reason="Explicit digital twin reference.",
            source="heuristic",
        )

    if (
        ("personalized data" in text or "personalised data" in text)
        and ("database" in text or "db" in text)
    ):
        return IntentDecision(
            mode=MEETING_HR_MODE,
            confidence=0.9,
            reason="Personalized data request tied to database context.",
            source="heuristic",
        )

    employee_hits = _employee_name_hits(text)
    if employee_hits:
        return IntentDecision(
            mode=MEETING_HR_MODE,
            confidence=0.92,
            reason=f"Matched known employee name(s): {', '.join(employee_hits[:3])}",
            source="heuristic",
        )

    hr_hits = _hits(text, HR_KEYWORDS)
    casual_hits = _hits(text, CASUAL_HINTS)

    if hr_hits and len(hr_hits) >= 2:
        return IntentDecision(
            mode=MEETING_HR_MODE,
            confidence=min(0.95, 0.65 + 0.1 * len(hr_hits)),
            reason=f"HR keywords detected: {', '.join(hr_hits[:4])}",
            source="heuristic",
        )

    if hr_hits and not casual_hits:
        return IntentDecision(
            mode=MEETING_HR_MODE,
            confidence=0.74,
            reason=f"Likely HR context from keyword: {hr_hits[0]}",
            source="heuristic",
        )

    if casual_hits and not hr_hits:
        return IntentDecision(
            mode=OUT_OF_SCOPE_MODE,
            confidence=min(0.94, 0.68 + 0.08 * len(casual_hits)),
            reason=f"Out-of-scope hints detected: {', '.join(casual_hits[:4])}",
            source="heuristic",
        )

    # Ambiguous messages are resolved by model-based classification.
    decision = _llm_classify(question)

    # If model is unsure about casual mode, prefer HR path so Mongo-backed context is available.
    if (
        decision.mode == OUT_OF_SCOPE_MODE
        and decision.confidence < 0.78
        and not casual_hits
    ):
        return IntentDecision(
            mode=MEETING_HR_MODE,
            confidence=0.7,
            reason=(
                "Ambiguous query with low-confidence out-of-scope classification; "
                "routing to HR intelligence for personalized context."
            ),
            source="hybrid-fallback",
        )

    return decision


def route_user_message(question: str, concise: bool = True) -> dict:
    navigation = resolve_navigation(question)
    if navigation is not None:
        decision = IntentDecision(
            mode=NAVIGATION_MODE,
            confidence=max(0.82, navigation.confidence),
            reason=navigation.reason,
            source="navigation-resolver",
        )
        return {
            "response": navigation_reply_text(navigation),
            "mode": decision.mode,
            "routing": decision.to_dict(),
            "navigation": navigation.to_dict(),
        }

    decision = classify_intent(question)

    if decision.mode == MEETING_HR_MODE:
        answer = hr_chat(question, concise=concise)
    else:
        answer = OUT_OF_SCOPE_CAPABILITIES_REPLY

    return {
        "response": answer,
        "mode": decision.mode,
        "routing": decision.to_dict(),
        "navigation": None,
    }
