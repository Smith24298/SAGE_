import os
from dotenv import load_dotenv

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv(os.path.join(_ROOT, "backend", ".env"))

from backend.employee_store import get_employee_insights, get_employee_profile, upsert_employee

profile = {
    "id": "2",
    "avatarIndex": 1,
    "baseSalary": "$120,000",
    "bonus": "$18,000",
    "dateOfJoining": "Mar 10, 2021",
    "department": "Product",
    "employeeId": "EMP-3182",
    "employmentType": "Full-time",
    "lastRevision": "Jan 2026",
    "location": "New York, NY",
    "manager": "David Williams",
    "name": "Sarah Johnson",
    "nextReview": "Jun 2026",
    "role": "Product Manager",
    "salaryHistory": [
        {"salary": 85000, "year": "2021"},
        {"salary": 95000, "year": "2022"},
        {"salary": 102000, "year": "2023"},
        {"salary": 110000, "year": "2024"},
        {"salary": 120000, "year": "2026"},
    ],
    "stockOptions": "$30,000",
    "totalCompensation": "$168,000",
}

insights = {
    "behavioral": {
        "collaborationStyle": "Highly collaborative",
        "communicationStyle": "Strategic and structured",
        "feedbackPreference": "Monthly feedback sessions",
        "motivationDrivers": "Product impact and leadership",
        "personalityTraits": "Strategic thinker, organized",
    },
    "communication": {
        "careerInterests": ["Head of Product", "Product Strategy"],
        "concernsRaised": ["Cross-team coordination"],
        "recentTopics": ["Product roadmap", "Customer feedback"],
        "topTopics": ["User experience", "Market expansion"],
    },
    "engagementMetrics": [
        {"fill": "#e1634a", "metric": "Engagement", "score": 85},
        {"fill": "#6b9080", "metric": "Participation", "score": 80},
        {"fill": "#a4b8c4", "metric": "Responsiveness", "score": 83},
        {"fill": "#f4a261", "metric": "Initiative", "score": 88},
    ],
    "meetings": [],
    "positiveNegative": "80/20",
    "risk": "Low",
    "riskIndicators": [
        {"color": "bg-green-500", "label": "Burnout Risk", "level": "Low"},
        {"color": "bg-green-500", "label": "Attrition Risk", "level": "Low"},
    ],
    "sentiment": 85,
    "sentimentTrend": [
        {"month": "Oct", "score": 82},
        {"month": "Nov", "score": 83},
        {"month": "Dec", "score": 84},
        {"month": "Jan", "score": 85},
        {"month": "Feb", "score": 86},
        {"month": "Mar", "score": 85},
    ],
}

upsert_employee(profile, insights)

saved_profile = get_employee_profile("1")
saved_insights = get_employee_insights("1")

print("SEEDED_PROFILE_NAME=", saved_profile.get("name") if saved_profile else None)
print("SEEDED_PROFILE_EMPLOYEE_ID=", saved_profile.get("employeeId") if saved_profile else None)
print("SEEDED_INSIGHT_SENTIMENT=", saved_insights.get("sentiment") if saved_insights else None)
print("SEEDED_INSIGHT_RISK=", saved_insights.get("risk") if saved_insights else None)
print(
    "SEEDED_TOP_TOPIC=",
    (saved_insights.get("communication") or {}).get("topTopics", [None])[0]
    if saved_insights
    else None,
)
