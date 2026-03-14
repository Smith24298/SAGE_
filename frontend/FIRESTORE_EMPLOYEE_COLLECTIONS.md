# Firestore Employee Collections

Employee data is split into **three collections** so profile, photo, and behavior/insights (including meetings) are stored separately.

## 1. `employee_profiles`

**Purpose:** Core profile and compensation for each employee (one document per employee).

**Document ID:** Use numeric string matching the app route, e.g. `"1"`, `"2"`, or the value of `employeeId` (e.g. `"EMP-2847"`).

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| name | string | Full name |
| role | string | Job title |
| department | string | Department name |
| manager | string | Manager name |
| dateOfJoining | string | e.g. "Jan 15, 2022" |
| employmentType | string | e.g. "Full-time" |
| location | string | e.g. "San Francisco, CA" |
| employeeId | string | e.g. "EMP-2847" |
| baseSalary | string | e.g. "$105,000" |
| bonus | string | e.g. "$15,000" |
| stockOptions | string | e.g. "$25,000" |
| totalCompensation | string | e.g. "$145,000" |
| lastRevision | string | e.g. "Jan 2026" |
| nextReview | string | e.g. "Jul 2026" |
| salaryHistory | array | `[{ year: "2022", salary: 75000 }, ...]` |
| documents | array | (optional) `[{ name: "Offer Letter" }, ...]` |
| avatarIndex | number | (optional) 0–7 for fallback avatar color when no photo |

---

## 2. `employee_photos`

**Purpose:** One document per employee storing the profile photo URL (e.g. from Firebase Storage or an external URL).

**Document ID:** Same as in `employee_profiles` (e.g. `"1"`, `"2"`).

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| url | string | Public URL of the photo |
| updatedAt | string | (optional) ISO date string |

---

## 3. `employee_insights`

**Purpose:** Behavior, personality, sentiment, engagement, communication insights, **meetings**, and risk indicators (all in one collection per your requirement).

**Document ID:** Same as in `employee_profiles` (e.g. `"1"`).

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| sentiment | number | Current sentiment score (e.g. 70) |
| sentimentTrend | array | `[{ month: "Oct", score: 78 }, ...]` |
| positiveNegative | string | (optional) e.g. "75/25" |
| risk | string | "Low" \| "Medium" \| "High" |
| behavioral | map | See below |
| engagementMetrics | array | See below |
| communication | map | See below |
| meetings | array | See below |
| riskIndicators | array | (optional) See below |

**behavioral** (map):

- communicationStyle (string)
- personalityTraits (string)
- motivationDrivers (string)
- feedbackPreference (string)
- collaborationStyle (string)

**engagementMetrics** (array of objects):

- metric (string), score (number), fill (string, hex color)

**communication** (map):

- topTopics (array of strings)
- concernsRaised (array of strings)
- careerInterests (array of strings)
- recentTopics (array of strings)

**meetings** (array of objects):

- date (string) e.g. "March 2026"
- topic (string) e.g. "Workload discussion"
- sentiment (string) e.g. "Neutral", "Positive", "Concerned"
- color (string) e.g. "bg-green-500"

**riskIndicators** (array of objects, optional):

- label (string) e.g. "Burnout Risk"
- level (string) "Low" \| "Medium" \| "High"
- color (string) e.g. "bg-red-500"

---

## How the app uses them

- **List page (`/employees`):** Reads `employee_profiles`, then for each employee loads `employee_photos` and `employee_insights` to show photo, sentiment, and risk. Falls back to local mock data if Firestore is empty or not configured.
- **Profile page (`/employee/[id]):** Loads one document from each collection by the same ID and merges profile + photo + insights (including meetings and risk indicators). Falls back to local mock data when Firestore has no data.

## Security rules

Restrict read/write by auth and optionally by role (e.g. only HR). Example for authenticated read, write only for same user or admin:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /employee_profiles/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;  // tighten to admin in production
    }
    match /employee_photos/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /employee_insights/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Seed data

Use the structure above and the examples in `firestore-seed-employees.example.json` to add documents via Firebase Console or a script. Match document IDs across all three collections (e.g. `"1"` in profiles, photos, and insights for the first employee).
