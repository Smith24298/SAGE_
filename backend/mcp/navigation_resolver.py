"""Navigation intent resolver for chat-driven route deep-linking."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Optional

from backend.employee_store import get_employee_profile


@dataclass
class NavigationDecision:
    path: str
    label: str
    confidence: float
    reason: str
    entity: Optional[dict[str, Any]] = None
    fallback_path: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "should_navigate": True,
            "path": self.path,
            "label": self.label,
            "confidence": round(max(0.0, min(1.0, float(self.confidence))), 3),
            "reason": self.reason,
        }
        if self.entity:
            payload["entity"] = self.entity
        if self.fallback_path:
            payload["fallback_path"] = self.fallback_path
        return payload


@dataclass(frozen=True)
class RouteSpec:
    path: str
    label: str
    aliases: tuple[str, ...]
    fallback_path: Optional[str] = None


NAVIGATION_VERBS = (
    "go to",
    "open",
    "take me",
    "navigate",
    "redirect",
    "bring me",
    "jump to",
    "switch to",
    "move to",
)

NAVIGATION_CONTEXT_WORDS = (
    "page",
    "screen",
    "section",
    "tab",
    "dashboard",
    "profile",
    "view",
)

TRANSCRIPT_UPLOAD_HINTS = (
    "upload transcript",
    "transcript upload",
    "upload meeting transcript",
    "transcript file",
)

ROUTE_SPECS: tuple[RouteSpec, ...] = (
    RouteSpec(
        path="/dashboard",
        label="Dashboard",
        aliases=(
            "dashboard",
            "chro dashboard",
            "overview dashboard",
            "executive dashboard",
        ),
        fallback_path="/",
    ),
    RouteSpec(
        path="/employees",
        label="Employees",
        aliases=("employees", "employee list", "people list", "team members"),
    ),
    RouteSpec(
        path="/workforce-insights",
        label="Workforce Insights",
        aliases=("workforce insights", "workforce", "headcount insights"),
    ),
    RouteSpec(
        path="/engagement-analytics",
        label="Engagement Analytics",
        aliases=(
            "engagement analytics",
            "engagement",
            "sentiment analytics",
            "wellbeing analytics",
        ),
    ),
    RouteSpec(
        path="/meeting-intelligence",
        label="Meeting Intelligence",
        aliases=(
            "meeting intelligence",
            "meeting insights",
            "meetings",
            "meeting page",
            "meeting summary",
        ),
    ),
    RouteSpec(
        path="/documents",
        label="Documents",
        aliases=("documents", "docs", "files", "hr documents"),
    ),
    RouteSpec(
        path="/ai-insights",
        label="AI Insights",
        aliases=("ai insights", "recommendations", "strategic recommendations"),
    ),
    RouteSpec(
        path="/events",
        label="Events",
        aliases=("events", "calendar", "engagement events", "townhall", "town hall"),
    ),
    RouteSpec(
        path="/departments",
        label="Departments",
        aliases=("departments", "department list", "department overview"),
    ),
    RouteSpec(
        path="/employee-insights",
        label="Employee Insights",
        aliases=("employee insights", "talent insights", "talent operations"),
    ),
    RouteSpec(
        path="/candidates",
        label="Candidates",
        aliases=("candidates", "candidate pipeline", "recruiting candidates"),
    ),
    RouteSpec(
        path="/auth/signin",
        label="Sign In",
        aliases=("sign in", "login", "log in"),
    ),
    RouteSpec(
        path="/auth/signup",
        label="Sign Up",
        aliases=("sign up", "register", "create account"),
    ),
)

DEPARTMENT_ALIASES: dict[str, str] = {
    "engineering": "engineering",
    "eng": "engineering",
    "sales": "sales",
    "marketing": "marketing",
    "design": "design",
    "hr": "hr",
    "human resources": "hr",
    "finance": "finance",
}

DEMO_EMPLOYEE_NAME_TO_ID: dict[str, str] = {
    "sarah johnson": "1",
    "michael chen": "2",
    "emily rodriguez": "3",
    "david kim": "4",
    "lisa wang": "5",
    "james wilson": "6",
}


def _normalize(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _contains_any(text: str, terms: tuple[str, ...]) -> bool:
    return any(term in text for term in terms)


def _looks_like_navigation_request(text: str) -> bool:
    if not text:
        return False

    has_navigation_verb = _contains_any(text, NAVIGATION_VERBS)
    if has_navigation_verb:
        return True

    if _contains_any(text, TRANSCRIPT_UPLOAD_HINTS):
        return True

    if "profile page" in text:
        return True

    has_context = _contains_any(text, NAVIGATION_CONTEXT_WORDS)
    mentions_known_alias = any(
        alias in text for spec in ROUTE_SPECS for alias in spec.aliases
    )
    return has_context and mentions_known_alias and (
        "show" in text or "view" in text or "open" in text or "go" in text
    )


def _resolve_transcript_navigation(text: str) -> Optional[NavigationDecision]:
    if not _contains_any(text, TRANSCRIPT_UPLOAD_HINTS):
        return None

    return NavigationDecision(
        path="/meeting-intelligence",
        label="Meeting Intelligence",
        confidence=0.98,
        reason="Transcript upload request mapped to meeting intelligence workspace.",
        fallback_path="/documents",
    )


def _clean_candidate(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9 .'-]", " ", value)
    cleaned = " ".join(cleaned.split()).strip()
    stop_phrases = (
        "profile",
        "page",
        "screen",
        "section",
        "dashboard",
        "details",
    )

    lowered = cleaned.lower()
    lowered = re.sub(r"'s\b", "", lowered)

    leading_phrases = (
        "take me to ",
        "go to ",
        "open ",
        "show ",
        "show me ",
        "view ",
        "navigate to ",
        "bring me to ",
    )
    for phrase in leading_phrases:
        if lowered.startswith(phrase):
            lowered = lowered[len(phrase) :]

    for phrase in stop_phrases:
        lowered = re.sub(rf"\b{re.escape(phrase)}\b", " ", lowered)

    lowered = " ".join(lowered.split()).strip()
    return lowered


def _extract_employee_references(text: str) -> list[str]:
    refs: list[str] = []

    for match in re.finditer(r"\bemployee\s+#?(\d{1,6})\b", text):
        refs.append(match.group(1))

    patterns = (
        r"\b([a-z][a-z .'-]{1,60})'?s\s+profile\b",
        r"\bprofile\s+(?:of|for)\s+([a-z][a-z .'-]{1,60})\b",
        r"\b(?:open|show|view|take me to|go to)\s+([a-z][a-z .'-]{1,60})\s+profile\b",
    )

    for pattern in patterns:
        for match in re.finditer(pattern, text):
            refs.append(match.group(1))

    deduped: list[str] = []
    seen: set[str] = set()
    for ref in refs:
        cleaned = _clean_candidate(ref)
        if len(cleaned) < 2:
            continue
        if cleaned not in seen:
            seen.add(cleaned)
            deduped.append(cleaned)

    return deduped


def _resolve_employee_navigation(text: str) -> Optional[NavigationDecision]:
    if "profile" not in text and "employee" not in text:
        return None

    for ref in _extract_employee_references(text):
        profile = get_employee_profile(ref)
        if not profile:
            demo_id = DEMO_EMPLOYEE_NAME_TO_ID.get(ref)
            if demo_id:
                title_name = " ".join(part.capitalize() for part in ref.split())
                return NavigationDecision(
                    path=f"/employee/{demo_id}",
                    label=f"{title_name} Profile",
                    confidence=0.9,
                    reason=f"Matched demo employee reference '{ref}'.",
                    entity={"type": "employee", "id": demo_id, "name": title_name},
                    fallback_path="/employees",
                )
            continue

        profile_id = str(profile.get("id") or "").strip()
        employee_name = str(profile.get("name") or ref).strip()
        if not profile_id:
            continue

        if profile_id.isdigit():
            profile_id = str(int(profile_id))

        return NavigationDecision(
            path=f"/employee/{profile_id}",
            label=f"{employee_name} Profile",
            confidence=0.96,
            reason=f"Matched employee reference '{ref}' to profile id {profile_id}.",
            entity={"type": "employee", "id": profile_id, "name": employee_name},
            fallback_path="/employees",
        )

    # Generic employee profile request with no exact person found.
    if "employee" in text or "profile" in text:
        return NavigationDecision(
            path="/employees",
            label="Employees",
            confidence=0.72,
            reason="Employee profile request without a resolvable person name.",
        )

    return None


def _extract_department_id(text: str) -> Optional[str]:
    patterns = (
        r"\bdepartment\s+([a-z ]{2,40})\b",
        r"\b([a-z ]{2,40})\s+department\b",
    )

    for pattern in patterns:
        for match in re.finditer(pattern, text):
            candidate = " ".join(match.group(1).strip().split())
            for alias, dep_id in DEPARTMENT_ALIASES.items():
                if alias == candidate or alias in candidate:
                    return dep_id

    for alias, dep_id in DEPARTMENT_ALIASES.items():
        if alias in text:
            return dep_id

    return None


def _resolve_department_navigation(text: str) -> Optional[NavigationDecision]:
    if "department" not in text and "departments" not in text:
        return None

    dep_id = _extract_department_id(text)
    if dep_id:
        return NavigationDecision(
            path=f"/department/{dep_id}",
            label=f"{dep_id.title()} Department",
            confidence=0.91,
            reason=f"Matched department reference to '{dep_id}'.",
            entity={"type": "department", "id": dep_id},
            fallback_path="/departments",
        )

    return NavigationDecision(
        path="/departments",
        label="Departments",
        confidence=0.8,
        reason="General department navigation request.",
    )


def _resolve_route_alias_navigation(text: str) -> Optional[NavigationDecision]:
    best_spec: Optional[RouteSpec] = None
    best_score = 0
    best_alias = ""

    for spec in ROUTE_SPECS:
        for alias in spec.aliases:
            if alias not in text:
                continue

            score = len(alias.split()) * 10
            if text.startswith(alias):
                score += 3
            if score > best_score:
                best_score = score
                best_spec = spec
                best_alias = alias

    if not best_spec:
        return None

    confidence = min(0.93, 0.7 + (best_score / 100.0))
    return NavigationDecision(
        path=best_spec.path,
        label=best_spec.label,
        confidence=confidence,
        reason=f"Matched route alias '{best_alias}'.",
        fallback_path=best_spec.fallback_path,
    )


def resolve_navigation(question: str) -> Optional[NavigationDecision]:
    text = _normalize(question)
    if not _looks_like_navigation_request(text):
        return None

    transcript_nav = _resolve_transcript_navigation(text)
    if transcript_nav:
        return transcript_nav

    employee_nav = _resolve_employee_navigation(text)
    if employee_nav:
        return employee_nav

    department_nav = _resolve_department_navigation(text)
    if department_nav:
        return department_nav

    return _resolve_route_alias_navigation(text)


def navigation_reply_text(decision: NavigationDecision) -> str:
    if (
        decision.path == "/meeting-intelligence"
        and "transcript upload" in decision.reason.lower()
    ):
        return (
            "Opening Meeting Intelligence now. "
            "Use the Upload Transcript button in the sidebar to add your file."
        )

    return f"Opening {decision.label} now."
