"""Reusable scoring utilities and pretrained-model helpers for AI insights."""

from __future__ import annotations

import os
import re
import importlib
from functools import lru_cache
from typing import Any, Iterable, Mapping, Sequence

SENTIMENT_MODEL_NAME = os.getenv(
    "SENTIMENT_MODEL_NAME", "cardiffnlp/twitter-roberta-base-sentiment"
)

POSITIVE_WORDS = {
    "good",
    "great",
    "happy",
    "motivated",
    "supported",
    "recognition",
    "growth",
    "collaborative",
    "positive",
    "improved",
    "healthy",
    "energized",
}

NEGATIVE_WORDS = {
    "burnout",
    "stressed",
    "stress",
    "overload",
    "overworked",
    "frustrated",
    "toxic",
    "unfair",
    "unhappy",
    "negative",
    "exhausted",
    "attrition",
    "quit",
}

WORKLOAD_KEYWORDS = {
    "workload",
    "overload",
    "deadline",
    "capacity",
    "overtime",
    "too much",
    "resource",
    "understaffed",
    "bandwidth",
}

STRESS_KEYWORDS = {
    "stress",
    "burnout",
    "anxious",
    "fatigue",
    "exhausted",
    "pressure",
    "tired",
    "mental",
}

EQUITY_KEYWORDS = {
    "fair",
    "fairness",
    "equity",
    "bias",
    "equal",
    "recognition",
    "compensation",
    "promotion",
}


def clamp(value: Any, low: float = 0.0, high: float = 1.0) -> float:
    """Clamp any numeric value into [low, high]."""
    try:
        val = float(value)
    except (TypeError, ValueError):
        return low
    if val < low:
        return low
    if val > high:
        return high
    return val


def normalize_sentiment(value: Any) -> float:
    """
    Normalize sentiment values into a 0..1 positive-sentiment scale.

    Supported inputs:
    - 0..100 (percentage-like)
    - 0..1
    - -1..1 (will be mapped to 0..1)
    """
    try:
        raw = float(value)
    except (TypeError, ValueError):
        return 0.5

    if -1.0 <= raw <= 1.0:
        # Distinguish 0..1 vs -1..1 by allowing negatives to trigger remap.
        if raw < 0:
            return clamp((raw + 1.0) / 2.0)
        return clamp(raw)
    if 1.0 < raw <= 100.0:
        return clamp(raw / 100.0)
    return clamp(raw)


@lru_cache(maxsize=1)
def _get_sentiment_pipeline():
    """Lazy-load HuggingFace sentiment pipeline if available."""
    try:
        transformers_module = importlib.import_module("transformers")
        pipeline = getattr(transformers_module, "pipeline")

        return pipeline(
            "sentiment-analysis",
            model=SENTIMENT_MODEL_NAME,
            tokenizer=SENTIMENT_MODEL_NAME,
        )
    except Exception as exc:  # pragma: no cover
        print(f"[analytics] Sentiment pipeline unavailable: {exc}")
        return None


def _hf_label_to_positive_score(label: str, score: float) -> float:
    lowered = (label or "").strip().lower()

    # cardiffnlp/twitter-roberta-base-sentiment often returns LABEL_0/1/2.
    if lowered in {"label_2", "positive", "pos"}:
        return clamp(score)
    if lowered in {"label_1", "neutral", "neu"}:
        return 0.5
    if lowered in {"label_0", "negative", "neg"}:
        return clamp(1.0 - score)

    # Unknown label fallback.
    return 0.5


def _lexicon_sentiment(text: str) -> float:
    tokens = re.findall(r"[a-zA-Z]+", (text or "").lower())
    if not tokens:
        return 0.5

    pos = sum(1 for t in tokens if t in POSITIVE_WORDS)
    neg = sum(1 for t in tokens if t in NEGATIVE_WORDS)

    if pos == 0 and neg == 0:
        return 0.5

    delta = (pos - neg) / max(pos + neg, 1)
    return clamp(0.5 + 0.4 * delta)


def predict_positive_sentiment(text: str) -> float:
    """Return positive-sentiment score in [0,1] using a pretrained model when available."""
    payload = (text or "").strip()
    if not payload:
        return 0.5

    model = _get_sentiment_pipeline()
    if model is not None:
        try:
            result = model(payload[:1200], truncation=True)[0]
            return _hf_label_to_positive_score(
                str(result.get("label", "")), float(result.get("score", 0.5))
            )
        except Exception as exc:  # pragma: no cover
            print(f"[analytics] Sentiment inference fallback to lexicon: {exc}")

    return _lexicon_sentiment(payload)


def predict_negative_sentiment(text: str) -> float:
    return clamp(1.0 - predict_positive_sentiment(text))


def keyword_signal_score(values: Iterable[Any], keywords: set[str]) -> float:
    """Estimate signal intensity by keyword coverage in a list of text values."""
    text = " ".join(str(v) for v in values if v is not None).lower()
    if not text:
        return 0.0

    hits = sum(1 for kw in keywords if kw in text)
    # Saturate quickly to avoid over-weighting very long text.
    return clamp(hits / 4.0)


def risk_level_to_score(level: Any) -> float:
    lowered = str(level or "").strip().lower()
    if lowered == "high":
        return 0.9
    if lowered == "medium":
        return 0.6
    if lowered == "low":
        return 0.3
    return 0.0


def parse_engagement_components(
    engagement_profile: Mapping[str, Any] | None,
    engagement_metrics: Sequence[Mapping[str, Any]] | None,
) -> tuple[float, float, float]:
    """
    Extract participation, responsiveness, initiative in 0..1 scale.

    Priority:
    1) engagement_profile values
    2) engagement_metrics list from Firestore
    3) fallback 0.5
    """
    participation = None
    responsiveness = None
    initiative = None
    engagement_level = None

    if engagement_profile:
        participation = engagement_profile.get("participation")
        responsiveness = engagement_profile.get("responsiveness")
        initiative = engagement_profile.get("initiative")
        engagement_level = engagement_profile.get("engagement_level")

    metric_map: dict[str, Any] = {}
    if engagement_metrics:
        for row in engagement_metrics:
            key = str(row.get("metric", "")).strip().lower()
            metric_map[key] = row.get("score")

    if participation is None:
        participation = metric_map.get("participation", engagement_level)
    if responsiveness is None:
        responsiveness = metric_map.get("responsiveness", engagement_level)
    if initiative is None:
        initiative = metric_map.get("initiative", engagement_level)

    def _norm(value: Any) -> float:
        if value is None:
            return 0.5
        try:
            raw = float(value)
        except (TypeError, ValueError):
            return 0.5
        if raw > 1.0:
            return clamp(raw / 100.0)
        return clamp(raw)

    return _norm(participation), _norm(responsiveness), _norm(initiative)


def engagement_score(participation: float, responsiveness: float, initiative: float) -> float:
    """engagement = 0.4*participation + 0.3*responsiveness + 0.3*initiative"""
    return clamp(
        0.4 * clamp(participation)
        + 0.3 * clamp(responsiveness)
        + 0.3 * clamp(initiative)
    )


def burnout_risk_score(
    negative_sentiment: float,
    workload_signals: float,
    stress_signals: float,
) -> float:
    """burnout = 0.5*negative_sentiment + 0.3*workload_signals + 0.2*stress_signals"""
    return clamp(
        0.5 * clamp(negative_sentiment)
        + 0.3 * clamp(workload_signals)
        + 0.2 * clamp(stress_signals)
    )


def organizational_health_score(
    sentiment: float,
    engagement: float,
    burnout_risk: float,
    equity_score: float,
) -> float:
    """health = 0.4*sentiment + 0.3*engagement + 0.2*(1-burnout) + 0.1*equity"""
    return clamp(
        0.4 * clamp(sentiment)
        + 0.3 * clamp(engagement)
        + 0.2 * (1.0 - clamp(burnout_risk))
        + 0.1 * clamp(equity_score)
    )


def estimate_equity_score(equity_concerns: bool, fairness_text: Iterable[Any]) -> float:
    fairness_signal = keyword_signal_score(fairness_text, EQUITY_KEYWORDS)
    if equity_concerns:
        return clamp(0.35 - 0.2 * fairness_signal)
    return clamp(0.85 - 0.25 * fairness_signal)


def estimate_workload_signal(text_values: Iterable[Any]) -> float:
    return keyword_signal_score(text_values, WORKLOAD_KEYWORDS)


def estimate_stress_signal(
    text_values: Iterable[Any],
    risk_levels: Iterable[Any],
    burnout_risk_hint: Any,
) -> float:
    keyword_score = keyword_signal_score(text_values, STRESS_KEYWORDS)
    risk_score = 0.0
    for item in risk_levels:
        risk_score = max(risk_score, risk_level_to_score(item))

    hint = clamp(burnout_risk_hint)
    return clamp(max(keyword_score, 0.7 * risk_score, hint))
