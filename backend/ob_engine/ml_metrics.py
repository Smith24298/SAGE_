"""ML-style metrics extraction for transcript-driven burnout updates.

This module converts transcript signals into normalized metrics that can be
stored on each employee digital twin.
"""

from __future__ import annotations

import re
from typing import Iterable


POSITIVE_WORDS = {
    "good",
    "great",
    "happy",
    "excited",
    "enjoy",
    "enjoying",
    "progress",
    "collaboration",
    "support",
    "positive",
    "confident",
    "appreciate",
    "thanks",
}

NEGATIVE_WORDS = {
    "overwhelmed",
    "pressure",
    "stressed",
    "stress",
    "burnout",
    "exhausted",
    "urgent",
    "problem",
    "delay",
    "risk",
    "issue",
    "frustrated",
    "tight",
    "unrealistic",
    "too much",
    "overloaded",
    "deadline",
}

STRESS_KEYWORDS = {
    "deadline",
    "deadlines",
    "urgent",
    "overloaded",
    "pressure",
    "problem",
    "delay",
    "risk",
    "issue",
    "stress",
    "burnout",
    "tight timeline",
}

DEADLINE_KEYWORDS = {
    "deadline",
    "deadlines",
    "timeline",
    "due",
    "asap",
    "urgent",
}

TASK_ASSIGNMENT_KEYWORDS = {
    "you need to",
    "you should",
    "please",
    "assigned",
    "task",
    "action item",
    "follow up",
    "deliver",
    "complete",
}

INTERRUPTION_KEYWORDS = {
    "sorry to interrupt",
    "interrupt",
    "cut you off",
    "hold on",
    "one sec",
    "wait",
}


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", (text or "").lower())


def _count_keyword_occurrences(text: str, keywords: Iterable[str]) -> int:
    normalized = (text or "").lower()
    total = 0
    for keyword in keywords:
        total += normalized.count(keyword)
    return total


def _sentiment_score(text: str) -> float:
    tokens = _tokenize(text)
    if not tokens:
        return 0.0

    positive = sum(1 for token in tokens if token in POSITIVE_WORDS)
    negative = sum(1 for token in tokens if token in NEGATIVE_WORDS)

    score = (positive - negative) / max(1, positive + negative)
    return round(_clamp(score, -1.0, 1.0), 4)


def _estimate_speaking_time_seconds(text: str) -> int:
    words = len(_tokenize(text))
    # ~2.5 words/sec conversational pace.
    return max(10, int(round(words / 2.5)))


def estimate_meeting_duration_minutes(all_messages: list[str]) -> int:
    words = len(_tokenize(" ".join(all_messages)))
    # ~130 words/minute speaking pace.
    return max(5, int(round(words / 130)))


def _estimate_meetings_today(transcript: str, deadline_mentions: int) -> int:
    baseline = 2
    text = (transcript or "").lower()
    if "back to back" in text:
        baseline += 2
    if "another meeting" in text or "next meeting" in text:
        baseline += 1
    baseline += min(3, deadline_mentions // 2)
    return int(_clamp(float(baseline), 1.0, 8.0))


def _estimate_back_to_back(meetings_today: int, transcript: str) -> int:
    text = (transcript or "").lower()
    if "back to back" in text:
        return int(_clamp(float(meetings_today - 1), 1.0, 6.0))
    return int(_clamp(float(max(0, meetings_today - 3)), 0.0, 6.0))


def build_speaker_ml_metrics(
    speaker_messages: list[str],
    participant_count: int,
    meeting_duration_minutes: int,
    full_meeting_text: str,
) -> dict:
    """Build transcript-derived burnout metrics for one speaker."""
    combined = " ".join(speaker_messages)
    speaking_turns = max(1, len(speaker_messages))
    speaking_time_seconds = _estimate_speaking_time_seconds(combined)

    sentiment = _sentiment_score(combined)
    stress_keywords = _count_keyword_occurrences(combined, STRESS_KEYWORDS)
    deadline_mentions = _count_keyword_occurrences(combined, DEADLINE_KEYWORDS)
    tasks_assigned = _count_keyword_occurrences(combined, TASK_ASSIGNMENT_KEYWORDS)
    interruptions = _count_keyword_occurrences(combined, INTERRUPTION_KEYWORDS)

    meetings_today = _estimate_meetings_today(full_meeting_text, deadline_mentions)
    back_to_back = _estimate_back_to_back(meetings_today, full_meeting_text)

    speaking_ratio = speaking_time_seconds / max(1, meeting_duration_minutes * 60)
    speaking_ratio = round(_clamp(speaking_ratio, 0.0, 1.0), 4)

    meeting_overload = meetings_today + back_to_back + (meeting_duration_minutes / 60.0)

    # Normalization mirrors the logic from the provided notebook formula.
    sentiment_component = _clamp((1.0 - sentiment) / 2.0, 0.0, 1.0)
    overload_component = _clamp(meeting_overload / 10.0, 0.0, 1.0)
    stress_component = _clamp(stress_keywords / 6.0, 0.0, 1.0)
    deadline_component = _clamp(deadline_mentions / 6.0, 0.0, 1.0)
    task_component = _clamp(tasks_assigned / 6.0, 0.0, 1.0)

    burnout_score = (
        0.25 * sentiment_component
        + 0.25 * overload_component
        + 0.20 * stress_component
        + 0.15 * deadline_component
        + 0.15 * task_component
    )
    burnout_score = round(_clamp(burnout_score, 0.0, 1.0), 4)

    if burnout_score >= 0.67:
        risk_label = "High"
    elif burnout_score >= 0.4:
        risk_label = "Medium"
    else:
        risk_label = "Low"

    return {
        "model_version": "ml_metrics_v1",
        "meeting_duration_minutes": meeting_duration_minutes,
        "participant_count": int(max(1, participant_count)),
        "speaking_time_seconds": speaking_time_seconds,
        "speaking_turns": speaking_turns,
        "interruptions": interruptions,
        "meetings_today": meetings_today,
        "back_to_back_meetings": back_to_back,
        "deadline_mentions": deadline_mentions,
        "tasks_assigned": tasks_assigned,
        "sentiment_score": sentiment,
        "stress_keywords": stress_keywords,
        "speaking_ratio": speaking_ratio,
        "meeting_overload": round(meeting_overload, 4),
        "burnout_score": burnout_score,
        "burnout_risk_label": risk_label,
    }
