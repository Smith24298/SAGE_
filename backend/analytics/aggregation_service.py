"""Aggregation helpers for department, role, and team analytics."""

from __future__ import annotations

from collections import defaultdict
from typing import Any, Iterable


def _avg(rows: list[dict[str, Any]], key: str) -> float:
    if not rows:
        return 0.0
    total = 0.0
    count = 0
    for row in rows:
        value = row.get(key)
        if value is None:
            continue
        try:
            total += float(value)
            count += 1
        except (TypeError, ValueError):
            continue
    if count == 0:
        return 0.0
    return total / count


def _group_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "count": len(rows),
        "avg_sentiment": round(_avg(rows, "sentiment"), 4),
        "engagement": round(_avg(rows, "engagement"), 4),
        "burnout_risk": round(_avg(rows, "burnout_risk"), 4),
        "health_score": round(_avg(rows, "health_score"), 4),
        "avg_participation": round(_avg(rows, "participation"), 4),
        "avg_responsiveness": round(_avg(rows, "responsiveness"), 4),
        "avg_initiative": round(_avg(rows, "initiative"), 4),
        "equity_score": round(_avg(rows, "equity_score"), 4),
    }


def aggregate_by(records: Iterable[dict[str, Any]], key: str) -> dict[str, dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for row in records:
        raw = row.get(key)
        name = str(raw).strip() if raw else "Unknown"
        groups[name].append(row)

    return {
        group_name: _group_summary(group_rows)
        for group_name, group_rows in sorted(groups.items(), key=lambda x: x[0].lower())
    }


def aggregate_all(records: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "global": _group_summary(records),
        "department": aggregate_by(records, "department"),
        "role": aggregate_by(records, "role"),
        "team": aggregate_by(records, "team"),
    }
