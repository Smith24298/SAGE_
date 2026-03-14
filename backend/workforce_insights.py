"""Mongo-backed workforce insights payload for the Workforce Insights page."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from backend.database import db


def _safe_collection(name: str):
    if db is None:
        raise RuntimeError("Database connection not available")
    return db[name]


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_join_date(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value

    text = str(value or "").strip()
    if not text:
        return None

    for fmt in (
        "%b %d, %Y",  # Jan 12, 2021
        "%B %d, %Y",  # January 12, 2021
        "%Y-%m-%d",  # 2026-03-14
    ):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def _quarter_start(dt: datetime) -> datetime:
    q = (dt.month - 1) // 3
    month = q * 3 + 1
    return datetime(dt.year, month, 1)


def _ensure_default_kpis() -> dict[str, Any]:
    """Ensure `workforce_kpis` has a singleton doc with optional manual KPIs.

    We compute what we can (total employees, avg tenure, new hires). Turnover and
    diversity often require HRIS data; we store them here so the UI can stay
    dynamic even when not derivable from existing collections.
    """

    col = _safe_collection("workforce_kpis")
    doc = col.find_one({"_id": "default"}, {"_id": 0})
    if doc:
        return doc

    seed = {
        "_id": "default",
        "turnoverRatePct": 0.0,
        # Keep previous UI demo as editable defaults; adjust later from real HRIS.
        "diversity": [
            {"category": "Women", "value": 45},
            {"category": "Men", "value": 52},
            {"category": "Non-binary", "value": 3},
        ],
        "updatedAt": datetime.now(timezone.utc),
    }
    col.insert_one(seed)
    seed.pop("_id", None)
    return seed


def build_workforce_insights(window_days: int = 90) -> dict[str, Any]:
    """Build payload for Workforce Insights page.

    Uses `employee_profiles` as source-of-truth for department and join dates.
    - departmentGrowth.growth = new hires in last `window_days`
    - diversityData + turnoverRatePct come from `workforce_kpis` singleton doc
    - avgTenureYears computed from join dates
    """

    profiles = list(_safe_collection("employee_profiles").find({}, {"_id": 0}))
    now = datetime.now(timezone.utc)
    window_start = now.replace(tzinfo=None)  # join dates are naive
    window_start = window_start - __import__("datetime").timedelta(days=max(1, int(window_days)))

    dept_headcount: dict[str, int] = defaultdict(int)
    dept_growth: dict[str, int] = defaultdict(int)

    join_dates: list[datetime] = []
    new_hires_q1 = 0
    q_start = _quarter_start(now.replace(tzinfo=None))

    for p in profiles:
        dept = str(p.get("department") or "Unknown").strip() or "Unknown"
        dept_headcount[dept] += 1

        joined = _parse_join_date(p.get("dateOfJoining"))
        if joined is None:
            continue

        join_dates.append(joined)

        if joined >= window_start:
            dept_growth[dept] += 1

        if joined >= q_start:
            new_hires_q1 += 1

    department_growth = [
        {
            "department": dept,
            "headcount": dept_headcount[dept],
            "growth": dept_growth.get(dept, 0),
        }
        for dept in sorted(dept_headcount.keys(), key=str.lower)
    ]

    # Avg tenure (years)
    tenure_years: list[float] = []
    for joined in join_dates:
        delta_days = max(0.0, (now.replace(tzinfo=None) - joined).days)
        tenure_years.append(delta_days / 365.25)

    avg_tenure_years = round(sum(tenure_years) / len(tenure_years), 1) if tenure_years else 0.0

    kpis_doc = _ensure_default_kpis()
    diversity = kpis_doc.get("diversity")
    diversity_data = (
        diversity
        if isinstance(diversity, list)
        else [
            {"category": "Women", "value": 45},
            {"category": "Men", "value": 52},
            {"category": "Non-binary", "value": 3},
        ]
    )

    turnover_rate_pct = _to_float(kpis_doc.get("turnoverRatePct"), 0.0)

    return {
        "departmentGrowth": department_growth,
        "diversityData": [
            {
                "category": str(item.get("category") or "Unknown"),
                "value": _to_int(item.get("value"), 0),
            }
            for item in diversity_data
            if isinstance(item, dict)
        ],
        "metrics": {
            "totalEmployees": len(profiles),
            "newHiresQ1": new_hires_q1,
            "turnoverRatePct": round(max(0.0, turnover_rate_pct), 1),
            "avgTenureYears": avg_tenure_years,
        },
    }
