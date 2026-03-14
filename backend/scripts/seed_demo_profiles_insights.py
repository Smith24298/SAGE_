"""Seed demo employee profiles and insights into MongoDB.

- Uses upsert so rerunning is safe.
- Keeps profile and insights as separate payloads.
"""

import os
import sys
from dotenv import load_dotenv

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.append(_ROOT)
load_dotenv(os.path.join(_ROOT, "backend", ".env"))

from backend.employee_store import upsert_employee


PROFILES = [
    {
        "id": "1",
        "avatarIndex": 0,
        "baseSalary": "$118,000",
        "bonus": "$16,000",
        "dateOfJoining": "Jan 12, 2021",
        "department": "Engineering",
        "employeeId": "EMP-2847",
        "employmentType": "Full-time",
        "lastRevision": "Jan 2026",
        "location": "Austin, TX",
        "manager": "Priya Patel",
        "name": "John Doe",
        "nextReview": "Jun 2026",
        "role": "Senior Software Engineer",
        "salaryHistory": [
            {"salary": 92000, "year": "2021"},
            {"salary": 98000, "year": "2022"},
            {"salary": 106000, "year": "2023"},
            {"salary": 112000, "year": "2024"},
            {"salary": 118000, "year": "2026"},
        ],
        "stockOptions": "$26,000",
        "totalCompensation": "$160,000",
    },
    {
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
    },
    {
        "id": "3",
        "avatarIndex": 2,
        "baseSalary": "$98,000",
        "bonus": "$12,000",
        "dateOfJoining": "Aug 1, 2022",
        "department": "Marketing",
        "employeeId": "EMP-3301",
        "employmentType": "Full-time",
        "lastRevision": "Jan 2026",
        "location": "Seattle, WA",
        "manager": "Laura Kim",
        "name": "Michael Chen",
        "nextReview": "Aug 2026",
        "role": "Growth Marketing Lead",
        "salaryHistory": [
            {"salary": 76000, "year": "2022"},
            {"salary": 86000, "year": "2023"},
            {"salary": 92000, "year": "2024"},
            {"salary": 98000, "year": "2026"},
        ],
        "stockOptions": "$14,000",
        "totalCompensation": "$124,000",
    },
    {
        "id": "4",
        "avatarIndex": 3,
        "baseSalary": "$110,000",
        "bonus": "$15,000",
        "dateOfJoining": "May 16, 2023",
        "department": "HR",
        "employeeId": "EMP-3498",
        "employmentType": "Full-time",
        "lastRevision": "Jan 2026",
        "location": "Chicago, IL",
        "manager": "Nina Shah",
        "name": "Aisha Khan",
        "nextReview": "Sep 2026",
        "role": "Senior HR Business Partner",
        "salaryHistory": [
            {"salary": 88000, "year": "2023"},
            {"salary": 98000, "year": "2024"},
            {"salary": 104000, "year": "2025"},
            {"salary": 110000, "year": "2026"},
        ],
        "stockOptions": "$16,000",
        "totalCompensation": "$141,000",
    },
    {
        "id": "5",
        "avatarIndex": 4,
        "baseSalary": "$102,000",
        "bonus": "$14,000",
        "dateOfJoining": "Feb 5, 2022",
        "department": "UX Design",
        "employeeId": "EMP-3550",
        "employmentType": "Full-time",
        "lastRevision": "Jan 2026",
        "location": "Los Angeles, CA",
        "manager": "Laura Kim",
        "name": "Emily Rodriguez",
        "nextReview": "Jul 2026",
        "role": "Senior UX Designer",
        "salaryHistory": [
            {"salary": 82000, "year": "2022"},
            {"salary": 90000, "year": "2023"},
            {"salary": 96000, "year": "2024"},
            {"salary": 102000, "year": "2026"},
        ],
        "stockOptions": "$18,000",
        "totalCompensation": "$134,000",
    },
    {
        "id": "6",
        "avatarIndex": 5,
        "baseSalary": "$108,000",
        "bonus": "$13,000",
        "dateOfJoining": "Nov 7, 2022",
        "department": "Finance",
        "employeeId": "EMP-3664",
        "employmentType": "Full-time",
        "lastRevision": "Jan 2026",
        "location": "Boston, MA",
        "manager": "Rohit Mehta",
        "name": "Daniel Wright",
        "nextReview": "Oct 2026",
        "role": "FP&A Manager",
        "salaryHistory": [
            {"salary": 84000, "year": "2022"},
            {"salary": 93000, "year": "2023"},
            {"salary": 101000, "year": "2024"},
            {"salary": 108000, "year": "2026"},
        ],
        "stockOptions": "$15,000",
        "totalCompensation": "$136,000",
    },
]


INSIGHTS_BY_ID = {
    "1": {
        "behavioral": {
            "collaborationStyle": "Solution-oriented collaboration",
            "communicationStyle": "Direct and practical",
            "feedbackPreference": "Bi-weekly check-ins",
            "motivationDrivers": "Technical excellence",
            "personalityTraits": "Analytical, dependable",
        },
        "communication": {
            "careerInterests": ["Engineering Management"],
            "concernsRaised": ["Legacy system complexity"],
            "recentTopics": ["Architecture modernization"],
            "topTopics": ["Technical architecture", "System reliability"],
        },
        "engagementMetrics": [
            {"fill": "#e1634a", "metric": "Engagement", "score": 78},
            {"fill": "#6b9080", "metric": "Participation", "score": 76},
            {"fill": "#a4b8c4", "metric": "Responsiveness", "score": 74},
            {"fill": "#f4a261", "metric": "Initiative", "score": 79},
        ],
        "meetings": [],
        "positiveNegative": "78/22",
        "risk": "Medium",
        "riskIndicators": [
            {"color": "bg-yellow-500", "label": "Burnout Risk", "level": "Medium"},
        ],
        "sentiment": 78,
        "sentimentTrend": [
            {"month": "Oct", "score": 74},
            {"month": "Nov", "score": 75},
            {"month": "Dec", "score": 76},
            {"month": "Jan", "score": 77},
            {"month": "Feb", "score": 79},
            {"month": "Mar", "score": 78},
        ],
    },
    "2": {
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
    },
    "3": {
        "behavioral": {
            "collaborationStyle": "Campaign-driven teamwork",
            "communicationStyle": "Fast and persuasive",
            "feedbackPreference": "Weekly standups",
            "motivationDrivers": "Growth outcomes",
            "personalityTraits": "Energetic, data-driven",
        },
        "communication": {
            "careerInterests": ["VP Marketing"],
            "concernsRaised": ["Campaign budget pacing"],
            "recentTopics": ["Lead generation"],
            "topTopics": ["Demand generation", "Brand campaigns"],
        },
        "engagementMetrics": [
            {"fill": "#e1634a", "metric": "Engagement", "score": 81},
            {"fill": "#6b9080", "metric": "Participation", "score": 79},
            {"fill": "#a4b8c4", "metric": "Responsiveness", "score": 77},
            {"fill": "#f4a261", "metric": "Initiative", "score": 82},
        ],
        "meetings": [],
        "positiveNegative": "81/19",
        "risk": "Low",
        "riskIndicators": [
            {"color": "bg-green-500", "label": "Burnout Risk", "level": "Low"},
        ],
        "sentiment": 81,
        "sentimentTrend": [
            {"month": "Oct", "score": 78},
            {"month": "Nov", "score": 79},
            {"month": "Dec", "score": 80},
            {"month": "Jan", "score": 81},
            {"month": "Feb", "score": 82},
            {"month": "Mar", "score": 81},
        ],
    },
    "4": {
        "behavioral": {
            "collaborationStyle": "People-first facilitation",
            "communicationStyle": "Empathetic and clear",
            "feedbackPreference": "1:1 coaching sessions",
            "motivationDrivers": "Employee development",
            "personalityTraits": "Supportive, composed",
        },
        "communication": {
            "careerInterests": ["HR Leadership"],
            "concernsRaised": ["Manager capability gaps"],
            "recentTopics": ["Retention planning"],
            "topTopics": ["Career growth", "Manager coaching"],
        },
        "engagementMetrics": [
            {"fill": "#e1634a", "metric": "Engagement", "score": 76},
            {"fill": "#6b9080", "metric": "Participation", "score": 74},
            {"fill": "#a4b8c4", "metric": "Responsiveness", "score": 75},
            {"fill": "#f4a261", "metric": "Initiative", "score": 77},
        ],
        "meetings": [],
        "positiveNegative": "76/24",
        "risk": "Medium",
        "riskIndicators": [
            {"color": "bg-yellow-500", "label": "Burnout Risk", "level": "Medium"},
        ],
        "sentiment": 76,
        "sentimentTrend": [
            {"month": "Oct", "score": 73},
            {"month": "Nov", "score": 74},
            {"month": "Dec", "score": 75},
            {"month": "Jan", "score": 76},
            {"month": "Feb", "score": 77},
            {"month": "Mar", "score": 76},
        ],
    },
    "5": {
        "behavioral": {
            "collaborationStyle": "Creative collaboration",
            "communicationStyle": "Visual and interactive",
            "feedbackPreference": "Design reviews",
            "motivationDrivers": "User experience impact",
            "personalityTraits": "Creative, empathetic",
        },
        "communication": {
            "careerInterests": ["Design Leadership"],
            "concernsRaised": ["Design system adoption"],
            "recentTopics": ["UX improvements"],
            "topTopics": ["User research", "Product usability"],
        },
        "engagementMetrics": [
            {"fill": "#e1634a", "metric": "Engagement", "score": 84},
            {"fill": "#6b9080", "metric": "Participation", "score": 82},
            {"fill": "#a4b8c4", "metric": "Responsiveness", "score": 80},
            {"fill": "#f4a261", "metric": "Initiative", "score": 85},
        ],
        "meetings": [],
        "positiveNegative": "82/18",
        "risk": "Low",
        "riskIndicators": [
            {"color": "bg-green-500", "label": "Burnout Risk", "level": "Low"},
        ],
        "sentiment": 84,
        "sentimentTrend": [
            {"month": "Oct", "score": 80},
            {"month": "Nov", "score": 82},
            {"month": "Dec", "score": 83},
            {"month": "Jan", "score": 84},
            {"month": "Feb", "score": 85},
            {"month": "Mar", "score": 84},
        ],
    },
    "6": {
        "behavioral": {
            "collaborationStyle": "Cross-functional planning",
            "communicationStyle": "Data-backed and concise",
            "feedbackPreference": "Quarterly reviews",
            "motivationDrivers": "Business impact",
            "personalityTraits": "Methodical, proactive",
        },
        "communication": {
            "careerInterests": ["Finance Director"],
            "concernsRaised": ["Cost pressure"],
            "recentTopics": ["Budget optimization"],
            "topTopics": ["Forecasting", "Cost controls"],
        },
        "engagementMetrics": [
            {"fill": "#e1634a", "metric": "Engagement", "score": 70},
            {"fill": "#6b9080", "metric": "Participation", "score": 68},
            {"fill": "#a4b8c4", "metric": "Responsiveness", "score": 69},
            {"fill": "#f4a261", "metric": "Initiative", "score": 71},
        ],
        "meetings": [],
        "positiveNegative": "70/30",
        "risk": "High",
        "riskIndicators": [
            {"color": "bg-red-500", "label": "Burnout Risk", "level": "High"},
        ],
        "sentiment": 70,
        "sentimentTrend": [
            {"month": "Oct", "score": 72},
            {"month": "Nov", "score": 71},
            {"month": "Dec", "score": 70},
            {"month": "Jan", "score": 69},
            {"month": "Feb", "score": 70},
            {"month": "Mar", "score": 70},
        ],
    },
}


def seed_all():
    inserted = 0
    for profile in PROFILES:
        emp_id = str(profile["id"])
        insights = INSIGHTS_BY_ID.get(emp_id)
        upsert_employee(profile, insights)
        inserted += 1
        print(f"UPSERTED employee id={emp_id} name={profile.get('name')}")

    print(f"DONE: upserted {inserted} profiles + insights")


if __name__ == "__main__":
    seed_all()
