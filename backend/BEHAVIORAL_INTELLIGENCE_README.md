# Behavioral & Engagement Intelligence Analysis System

This system analyzes employee **Behavioral Intelligence** and **Engagement Intelligence** by combining personality/assessment data with workplace transcripts.

## Overview

### Behavioral Intelligence
Analyzes stable personality traits and work preferences:
- **Communication Style**: How the employee communicates (direct, collaborative, formal, etc.)
- **Personality Summary**: Key personality traits observed
- **Motivation Drivers**: What drives the employee's performance
- **Feedback Preference**: How they prefer to receive feedback
- **Collaboration Style**: How they work with others

### Engagement Intelligence
Measures real-time workplace engagement metrics (0.0 to 1.0):
- **Engagement Level**: How emotionally/cognitively invested is the employee?
- **Participation**: Does the employee actively contribute ideas and feedback?
- **Responsiveness**: Does the employee react constructively to direction?
- **Initiative**: Does the employee proactively propose improvements?

## API Endpoints

### 1. Analyze Intelligence Report
**POST** `/api/analyze/intelligence`

Analyzes an employee's behavioral and engagement intelligence.

**Request:**
```json
{
  "employee_name": "John Doe",
  "personality_data": {
    "mbti": "ENTJ",
    "assessment_score": 78,
    "traits": ["leadership", "analytical"]
  },
  "transcript": "Employee said: I think we should streamline the process. I've drafted a proposal that...",
  "store_in_db": true,
  "update_twin": true
}
```

**Response:**
```json
{
  "status": "success",
  "report": {
    "employee": "John Doe",
    "behavioral_intelligence": {
      "communication_style": "Direct and strategic",
      "personality_summary": "Natural leader with strong analytical skills",
      "motivation_drivers": ["Recognition", "Career growth", "Problem-solving"],
      "feedback_preference": "Direct, data-driven feedback",
      "collaboration_style": "Team-focused with clear goals"
    },
    "engagement_intelligence": {
      "engagement_level": 0.85,
      "participation": 0.90,
      "responsiveness": 0.88,
      "initiative": 0.92,
      "key_signals": ["proactive solutions", "strategic thinking", "team leadership"],
      "reasoning": "Employee demonstrates high engagement through active participation and strategic contributions"
    }
  },
  "stored_in_db": true,
  "twin_updated": true
}
```

### 2. Get Intelligence Report
**GET** `/api/intelligence/report/{report_id}`

Retrieves a stored intelligence report by its MongoDB ID.

**Response:**
```json
{
  "status": "success",
  "report": {
    "_id": "507f1f77bcf86cd799439011",
    "employee": "John Doe",
    "behavioral_intelligence": {...},
    "engagement_intelligence": {...},
    "created_at": "2024-03-13T10:30:00Z"
  }
}
```

### 3. Get Employee History
**GET** `/api/intelligence/history/{employee_name}?limit=10`

Retrieves recent intelligence reports for an employee.

**Response:**
```json
{
  "status": "success",
  "employee": "John Doe",
  "reports_count": 3,
  "reports": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "created_at": "2024-03-13T10:30:00Z",
      "behavioral_intelligence": {...},
      "engagement_intelligence": {...}
    }
  ]
}
```

### 4. Get Employee Summary
**GET** `/api/intelligence/summary/{employee_name}`

Gets the latest behavioral and engagement summary from the employee's digital twin.

**Response:**
```json
{
  "status": "success",
  "summary": {
    "employee": "John Doe",
    "behavioral_profile": {
      "communication_style": "Direct and strategic",
      "personality_summary": "Natural leader",
      "motivation_drivers": ["Recognition", "Career growth"],
      "feedback_preference": "Direct feedback",
      "collaboration_style": "Team-focused",
      "updated_at": "2024-03-13T10:30:00Z"
    },
    "engagement_profile": {
      "engagement_level": 0.85,
      "participation": 0.90,
      "responsiveness": 0.88,
      "initiative": 0.92,
      "key_signals": ["proactive solutions"],
      "reasoning": "High engagement demonstrated",
      "updated_at": "2024-03-13T10:30:00Z"
    },
    "last_updated": "2024-03-13T10:30:00Z"
  }
}
```

## Integration with Meeting Pipeline

The meeting pipeline can automatically perform behavioral analysis:

```python
from backend.pipelines.meeting_pipeline import process_meeting

# Process meeting with behavioral analysis (default)
results = process_meeting(transcript_text)

# Each speaker's analysis includes:
# - Traditional OB insights (Maslow, Herzberg, etc.)
# - Behavioral Intelligence
# - Engagement Intelligence
```

## MongoDB Collections

### intelligence_reports
Stores all behavioral and engagement intelligence reports:
```javascript
{
  "_id": ObjectId,
  "employee": "John Doe",
  "employee_id": "optional_twin_id",
  "behavioral_intelligence": {...},
  "engagement_intelligence": {...},
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### digital_twins (enhanced)
Employee digital twins now include:
```javascript
{
  "name": "John Doe",
  "behavioral_profile": {
    "communication_style": "...",
    "personality_summary": "...",
    "motivation_drivers": [],
    "feedback_preference": "...",
    "collaboration_style": "...",
    "updated_at": ISODate
  },
  "engagement_profile": {
    "engagement_level": 0.85,
    "participation": 0.90,
    "responsiveness": 0.88,
    "initiative": 0.92,
    "key_signals": [],
    "reasoning": "...",
    "updated_at": ISODate
  },
  // ... other existing fields
}
```

## Usage Examples

### Python Backend
```python
from backend.ob_engine.behavioral_analyzer import generate_employee_intelligence_report
from backend.ob_engine.intelligence_storage import store_intelligence_report

# Personality data (from assessment)
personality = {
    "mbti": "ENTJ",
    "big_five": {"openness": 0.8, "conscientiousness": 0.9},
    "assessment_notes": "Strong leader"
}

# Recent transcript from meeting
transcript = """
John: I propose we restructure the workflow to be more efficient.
Jane: That sounds good, can you elaborate?
John: Absolutely. We can reduce bottlenecks by...
"""

# Generate report
report = generate_employee_intelligence_report("John Doe", personality, transcript)

# Store in database
stored = store_intelligence_report(report)
print(f"Stored with ID: {stored['_id']}")
```

### Using the API
```bash
curl -X POST http://localhost:8000/api/analyze/intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "employee_name": "John Doe",
    "personality_data": {"mbti": "ENTJ"},
    "transcript": "John said...",
    "store_in_db": true,
    "update_twin": true
  }'
```

## Scoring Interpretation

### Engagement Level (0.0 - 1.0)
- 0.0-0.3: **Disengaged** - Emotionally/cognitively uninvested
- 0.3-0.6: **Moderately Engaged** - Participates but not deeply invested
- 0.6-0.8: **Engaged** - Good investment in work
- 0.8-1.0: **Highly Engaged** - Strong emotional/cognitive investment

### Participation (0.0 - 1.0)
- 0.0-0.3: **Silent** - Rarely contributes
- 0.3-0.6: **Occasional** - Contributes sometimes
- 0.6-0.8: **Active** - Regularly shares ideas
- 0.8-1.0: **Highly Active** - Frequently contributes ideas/feedback

### Responsiveness (0.0 - 1.0)
- 0.0-0.3: **Unresponsive** - Doesn't react constructively
- 0.3-0.6: **Somewhat Responsive** - Some constructive reactions
- 0.6-0.8: **Responsive** - Generally reacts well
- 0.8-1.0: **Very Responsive** - Consistently constructive reactions

### Initiative (0.0 - 1.0)
- 0.0-0.3: **Passive** - Waits for direction
- 0.3-0.6: **Some Initiative** - Occasionally proactive
- 0.6-0.8: **Proactive** - Regularly proposes improvements
- 0.8-1.0: **Highly Proactive** - Consistently drives improvements

## Notes

- The system uses LLM (Groq) for intelligent analysis
- Scores are automatically clamped between 0.0 and 1.0
- Reports are stored in MongoDB for historical tracking
- Digital twins are automatically updated with latest intelligence
- Personality data is optional—system can analyze from transcript alone
