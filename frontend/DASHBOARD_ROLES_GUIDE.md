# Role-Specific Dashboard Guide

This document outlines the data, features, and UI requirements for each role-specific dashboard in SAGE.

---

## Dashboard Overview

After authentication and role selection, users are automatically routed to their role-specific dashboard:

| Role | Route | Current Component | Focus |
|------|-------|-------------------|-------|
| CHRO | `/dashboard` | `Dashboard.tsx` | Strategic executive view |
| HR Business Partner | `/employees` | `Employees.tsx` | Employee management |
| Talent Operations Manager | `/workforce-insights` | `WorkforceInsights.tsx` | Workforce planning |
| Employee Engagement Manager | `/engagement-analytics` | `EngagementAnalytics.tsx` | Employee well-being |

---

## Role 1: Chief Human Resources Officer (CHRO)

### Route: `/dashboard`
### Component: `src/app/pages/Dashboard.tsx`

### **Dashboard Purpose**
Executive-level strategic insights into workforce health, risks, and opportunities.

### **Key Metrics to Display**

#### 1. Department Stress & Engagement Overview
Show sentiment data by department:
- **Chart Type**: Grouped bar chart
- **X-Axis**: Departments (Engineering, Sales, Marketing, HR, Finance)
- **Y-Axis**: Score (0-100)
- **Bars**: 
  - Orange: Stress levels
  - Green: Engagement levels
- **Insight**: Identify departments with high stress or low engagement

#### 2. Attrition Risk Alerts
High-priority alert system:
```
📊 ATTRITION RISK SUMMARY
├── Employees at Risk: 12 (8% of workforce)
├── Highest Risk Department: Engineering
│   └── Risk Level: 7 employees (25% of dept)
├── Recommended Action: Schedule retention conversations
└── Next Review: 2 weeks
```

#### 3. Top Employee Concerns (Aggregated)
List of most common issues raised by employees:
1. **Workload Balance** - mentioned by 45 employees
2. **Career Growth** - mentioned by 38 employees
3. **Remote Flexibility** - mentioned by 32 employees
4. **Team Collaboration** - mentioned by 28 employees
5. **Salary & Compensation** - mentioned by 22 employees

#### 4. Workforce Trends & Analytics
Time-series data showing:
- Overall engagement trend (last 90 days)
- Turnover rate vs industry benchmark
- Promotion vs external hiring rate
- Department growth vs budget allocation

### **AI Insights provided**
- "Engineering department shows elevated stress levels (65%). Consider workload review."
- "21% decrease in engagement this month. Recommend pulse survey."
- "7 employees identified at high attrition risk. Suggest retention conversations."

### **Header Elements**
- Total Employees: [COUNT]
- Attrition Rate: [%]
- Average Engagement: [SCORE]
- Departments: [COUNT]
- HR Team: [COUNT]

### **Design Notes**
- Executive-focused, data-dense layout
- Use dashboard preview card from sign-in for inspiration
- Blue/green color coding for metrics
- Alert system for critical issues (red for warnings)
- Executive summary at top
- Drill-down capability to details

---

## Role 2: HR Business Partner

### Route: `/employees`
### Component: `src/app/pages/Employees.tsx`

### **Dashboard Purpose**
Manage employee relationships, track individual well-being, and prepare for meaningful conversations.

### **Key Sections**

#### 1. Employee List/Directory
Searchable, filterable employee table:

| Name | Department | Role | Sentiment | Key Concerns | Last Updated |
|------|-----------|------|-----------|--------------|--------------|
| Sarah Chen | Engineering | Sr. Engineer | 😊 Happy | - | 2 days ago |
| Mike Johnson | Sales | Sales Mgr | 😐 Neutral | Workload | 1 day ago |
| Emma Davis | Marketing | Content Lead | 😟 Stressed | Balance, Growth | Today |

**Filters:**
- Department
- Sentiment (Happy, Neutral, Stressed)
- Risk Level (High, Medium, Low)
- Date Range

#### 2. Employee Profile Cards
Clicking on an employee shows:
- **Profile**: Name, title, department, tenure
- **Sentiment Trend**: Last 30 days chart
- **Key Concerns**: Top 3 issues employee mentioned
- **Strengths**: Skills and accomplishments
- **Sentiment Score**: 1-100 scale
- **Risk Level**: Visual indicator

#### 3. Meeting Preparation Assistant
AI-powered preparation for 1:1 meetings:
```
📋 MEETING PREPARATION FOR EMMA DAVIS

Recent Mood: 😐 Slightly Stressed
Last Meeting: 2 weeks ago
Topics to Cover:
1. Discuss workload and upcoming projects
2. Explore career growth opportunities
3. Feedback on new project management tool

Suggested Questions:
• "How are you feeling about the current workload?"
• "What's one thing we could improve this quarter?"
• "Are there any growth opportunities that interest you?"

Follow-up Items from Last Meeting:
✓ Flexible hours approved
⏳ Budget review pending
✓ Team expanded
```

#### 4. Interaction History
Timeline of all interactions with an employee:
- **Meetings**: 1:1s, performance reviews, training
- **Transcripts**: Meeting summaries (if meeting recorded)
- **Emails**: Relevant email summaries
- **HR Notes**: Documentation and follow-ups
- **Surveys**: Pulse survey responses
- **Feedback**: 360 feedback, peer reviews

**Example Entry:**
```
2024-03-10 | 1:1 Meeting with Emma Davis
Duration: 45 mins
Topics: Project feedback, personal development
Action Items: 
  - Enroll in React training course
  - Schedule skip-level with VP Engineering
Sentiment: Positive
```

#### 5. AI Insights for Each Employee
Triggered based on data:
- "Emma has mentioned burnout 3 times in last month. Recommend workload assessment."
- "High performer with limited growth opportunities in current team. Consider promotion or transfer."
- "Positive feedback from peers. Great candidate for mentship role."

### **Additional Features**
- **Action Items Tracking**: Tasks from meetings
- **Development Plans**: Career growth goals
- **Recognition Feed**: Positive feedback log
- **Alerts**: Immediate attention needed (resignation risk, performance issues)

### **Design Notes**
- Employee-centric, relationship-focused interface
- Balance data with human touch
- Easy note-taking during meetings
- Quick meeting prep before conversations
- Searchable history
- Export meeting summaries

---

## Role 3: Talent Operations Manager

### Route: `/workforce-insights`
### Component: `src/app/pages/WorkforceInsights.tsx`

### **Dashboard Purpose**
Strategic workforce planning, identify skill gaps, and optimize hiring and internal mobility.

### **Key Sections**

#### 1. Skill Gap Analysis
Identify critical skill shortages:

```
🎯 CRITICAL SKILL GAPS

High Priority (Needed Now):
├── Cloud Architecture (AWS) - 3 needed, 1 available
├── Data Science (ML) - 2 needed, 0 available  
├── Product Management - 1 needed, 0 available
└── Technical Writing - 2 needed, 1 available

Medium Priority (6 months):
├── UI/UX Design - 5 needed, 2 available
├── DevOps/Infrastructure - 2 needed, 1 available
└── Project Management - 3 needed, 1 available

Low Priority (Non-critical):
├── Financial Analysis - 1 needed, 1 available
└── Business Analysis - 2 needed, 2 available
```

**Matrix View:**
| Skill | Required | Current | Gap | Priority | Timeline |
|-------|----------|---------|-----|----------|----------|
| AWS | 4 | 1 | 3 | 🔴 High | Immediate |
| ML | 3 | 0 | 3 | 🔴 High | Immediate |
| UX Design | 5 | 2 | 3 | 🟠 Medium | 3 months |

#### 2. Internal Mobility Insights
Employees open to growth:

```
📈 INTERNAL MOBILITY OPPORTUNITIES

Promotion Ready (Performance ≥ 90%):
├── Sarah Chen (Engineer → Senior Engineer)
│   └── Match Score: 98% | Recommended timeline: Q2
├── James Park (Analyst → Senior Analyst)
│   └── Match Score: 95% | Recommended timeline: Q1
└── Lisa Wong (Coordinator → Manager)
    └── Match Score: 92% | Recommended timeline: Q3

Department Transfer Interested:
├── Mike Johnson (Sales → Product)
│   └── Skills match: 78% | Training needed: Product fundamentals
├── Emma Davis (Marketing → Sales Operations)
│   └── Skills match: 85% | Ready for transition
└── Robert Brown (Engineering → Technical Sales)
    └── Skills match: 88% | Training needed: Sales skills

Career Break Recovery:
├── Jessica Martinez (Return from leave)
│   └── Recommended role: Available positions in Marketing
└── David Lee (Part-time → Full-time)
    └── Recommended role: Available positions in Engineering
```

#### 3. Hiring Recommendations
AI-driven hiring suggestions:

```
💼 HIRING RECOMMENDATIONS

🔴 URGENT - Engineering Department
├── Current workload: 145% of capacity
├── Pending projects: 3 major initiatives
├── Recommended hires: 2 back-end engineers
├── Timeline: Hire within 4 weeks
├── Salary benchmark: $150-180K
├── Expected ROI on hire: 2 months productivity gain

🟠 NEAR-TERM - Product Management
├── Demand spike: New product line launching Q2
├── Timeline: Hire within 8 weeks
├── Recommended hires: 1 product manager
├── Focus: Mobile-first, SaaS experience

🟡 PLANNED - Sales Operations
├── Business growth: +35% revenue target
├── Timeline: Hire within 12 weeks
├── Recommended hires: 1 sales operations manager
```

**Recommendation Logic:**
- Analyze department workload trends
- Compare to historical productivity metrics
- Factor in employee turnover rates
- Consider business growth plans
- Calculate hiring vs. outsourcing ROI

#### 4. Workforce Planning Dashboard
Strategic planning view:

```
📊 WORKFORCE PLANNING (12-MONTH FORECAST)

Headcount Planning:
├── Q1: 245 employees (current) + 3 planned hires = 248
├── Q2: 248 + 4 planned hires = 252
├── Q3: 252 + 2 planned hires = 254
└── Q4: 254 + 1 planned hire = 255

Budget Allocation by Department:
├── Engineering: 45% ($1.8M) - Up 10% for new hires
├── Sales: 30% ($1.2M) - No change
├── Marketing: 15% ($600K) - Down 5% (consolidation)
└── Operations: 10% ($400M) - Up 20% (new hire)

Retention Forecast:
├── Predicted attrition: 8-10%
├── Planned departures: 2
├── At-risk employees: 10-12
└── Recommended retention budget: $150K
```

#### 5. Competitive Analysis
Benchmark against industry:

```
🏆 COMPETITIVE ANALYSIS

Our Metrics vs. Industry Benchmark:
├── Average Salary (Engineers): $145K vs $155K industry (-6%)
├── Benefits Score: 8.2/10 vs 8.0 industry average
├── Turnover Rate: 12% vs 15% industry average
├── Time-to-hire: 35 days vs 42 days industry average
└── Offer-acceptance rate: 85% vs 78% industry average
```

### **AI Insights for Talent Ops**
- "Engineering department is at 145% capacity. Recommend hiring 2 engineers in next 4 weeks."
- "Sarah Chen and James Park are ready for promotions. Could fill 2 open senior roles."
- "Sales team shows 22% interest in Operations roles. Run cross-skill training program."

### **Additional Features**
- **Job Description Generator**: AI-created job postings
- **Hiring Pipeline**: Track applicants and progress
- **Compensation Analysis**: Salary benchmarking
- **Skills Training Path**: Recommended courses for skill gaps
- **Succession Planning**: Identify future leaders

### **Design Notes**
- Data-heavy, strategic perspective
- Clear visualizations for hiring decisions
- Trend analysis and forecasting
- ROI calculations prominently displayed
- Actionable recommendations with timelines
- Export reports for executive presentations

---

## Role 4: Employee Engagement Manager

### Route: `/engagement-analytics`
### Component: `src/app/pages/EngagementAnalytics.tsx`

### **Dashboard Purpose**
Monitor employee sentiment, detect well-being issues, and take proactive engagement actions.

### **Key Sections**

#### 1. Sentiment Trend Monitoring
Track overall employee happiness:

```
😊 SENTIMENT TIMELINE (Last 90 Days)

Week Ending | Sentiment Score | Trend | Key Changes
2024-03-08  | 72/100         | ↗️ +2 | Positive feedback on new benefits
2024-03-01  | 70/100         | ↘️ -3 | End-of-project stress
2024-02-23  | 73/100         | ↗️ +1 | Team building event well-received

Overall Trend: Stable with slight improvement
```

**Visual:**
- Line chart showing 90-day trend
- Color zones: Red (< 50), Yellow (50-70), Green (70+)
- Moving average overlay
- Department comparison lines

#### 2. Burnout Detection System
Proactive identification of at-risk employees:

```
🚨 BURNOUT RISK MONITORING

High Risk (Immediate Action):
├── Emma Davis (Engineering)
│   ├── Stress Level: 8.2/10 ↑ (up from 6.5 last week)
│   ├── Indicators: Long hours (55+ hrs/week), negative mentions about workload
│   ├── Emotional State: Frustrated, overwhelmed
│   └── Recommended: 1:1 meeting, workload assessment
│
├── Marcus Brown (Sales)
│   ├── Stress Level: 7.8/10
│   ├── Indicators: Missed deadlines, reduced engagement, few interactions
│   ├── Emotional State: Discouraged, isolated
│   └── Recommended: Team engagement activity, goal reset

Medium Risk (Monitor):
├── Lisa Johnson (Marketing) - 6.5/10
└── Robert Chen (HR) - 6.2/10

Recent Recoveries (Watch):
├── Jessica Martinez - Recovered from 7.9 to 5.2 after workload reduction
└── David Lee - Improved after promotion to full-time
```

**Burnout Indicators Tracked:**
- Work hours (daily/weekly)
- Meeting load
- Email volume (after hours)
- Sentiment in written communication
- Feedback sentiment
- Participation in social events
- Sick days
- Vacation usage

#### 3. Engagement Feedback Insights
Categorized feedback analysis:

```
💭 EMPLOYEE FEEDBACK ANALYSIS (Last Month)

Most Common Positive Themes:
1. Team Collaboration (87 mentions)
   - "Awesome team vibes!"
   - "Love working with my teammates"
   
2. Management Support (64 mentions)
   - "My manager is very supportive"
   - "Great one-on-ones with my lead"
   
3. Flexible Work (52 mentions)
   - "Appreciate the flexibility to work from home"

Most Common Concerns:
1. Workload & Balance (143 mentions)
   - "Too many projects at once"
   - "Working late every night"
   - Sentiment trend: ⬆️ +12% from last month
   
2. Career Growth (98 mentions)
   - "Need clearer promotion path"
   - "Would like more learning opportunities"
   
3. Communication (67 mentions)
   - "Unclear prioritization from leadership"
   - "Too many meetings"
   
4. Compensation & Benefits (54 mentions)
   - "Salary not competitive"
   - "Need better health coverage"
```

#### 4. Wellness Recommendations
Personalized well-being suggestions:

```
🌟 WELLNESS INTERVENTIONS

Immediate Actions (This Week):
├── Schedule 1:1 with Emma Davis (burnout risk)
├── Organize team building for Marketing (low engagement)
└── HR to review workload allocation in Engineering

Short-term (This Month):
├── Implement flexible Friday (based on feedback)
├── Launch learning budget program (career growth request)
├── Compensation review for high performers
├── Peer mentorship program kickoff

Long-term (Next Quarter):
├── Team building events (based on request volume)
├── Career pathing workshops
├── Wellness program expansion (yoga, meditation)
└── Feedback system improvements
```

#### 5. Department Engagement Scorecard
Comparative view by department:

```
📋 DEPARTMENT ENGAGEMENT SCORECARD

Department | Sentiment | Engagement | Retention | Burnout | Overall
-----------|-----------|------------|-----------|---------|--------
Engineering | 68/100 🟠 | 72/100 🟢 | 85% 🟢   | 8.2% 🔴 | 73/100 🟡
Sales       | 75/100 🟢 | 78/100 🟢 | 90% 🟢   | 4.1% 🟢 | 81/100 🟢
Marketing   | 64/100 🔴 | 60/100 🔴 | 78% 🟡   | 6.3% 🟡 | 63/100 🔴
HR          | 80/100 🟢 | 85/100 🟢 | 95% 🟢   | 2.1% 🟢 | 87/100 🟢
Finance     | 72/100 🟡 | 70/100 🟡 | 88% 🟢   | 5.2% 🟡 | 73/100 🟡

🟢 = Healthy | 🟡 = Monitor | 🔴 = Urgent
```

#### 6. AI-Powered Well-being Alerts
Automatic alerts triggered by patterns:

```
🤖 AI INSIGHTS

Critical Alerts:
⚠️ "Engineering team shows elevated fatigue across board. 
    Recommend workload review and team off-site."

⚠️ "3 high performers from Marketing considering external 
    opportunities based on career growth frustration. 
    Suggest career pathing conversations."

⚠️ "Positive: Sales team sentiment improved 8% after 
    new incentive program. Continue monitoring."

Opportunities:
💡 "Jessica Martinez recovered from burnout after workload 
    reduction. Use as case study for engineering department."

💡 "Team collaboration highest in Finance team. 
    Consider replicating their practices."
```

### **Additional Features**
- **Quick Actions**: Suggest interventions with one-click approval
- **Wellness Programs**: Track participation and effectiveness
- **Pulse Surveys**: Quick weekly check-ins
- **1:1 Notes**: Easy logging of conversations
- **Recognition System**: Celebrate wins and positive feedback
- **Resource Library**: Share wellness articles, tools

### **Design Notes**
- Empathetic, person-first interface
- Clear warning systems for at-risk employees
- Balanced between analytics and human touch
- Easy action items with approval workflow
- Privacy-conscious data display
- Trend charts with context and recommendations

---

## Cross-Role Features

### Universal Dashboard Elements

**Top Navigation:**
- User profile with role indicator
- SAGE logo and tagline
- Theme toggle (light/dark)
- Notifications (high priority only)
- Quick search (employees, data, insights)

**Left Sidebar:**
- Dashboard (role-specific)
- Core menu items:
  - CHRO: Dashboard, Insights, Reports, Settings
  - HR Partner: Employees, Conversations, Development, Settings
  - Talent Ops: Workforce, Hiring, Skills, Planning, Settings
  - Engagement: Analytics, Wellness, Feedback, Actions, Settings
- Logout option

**Always Visible:**
- Current user role
- Active theme
- Quick stats relevant to role

### Shared Components
- Common color scheme (#e1634a primary, #e9eae2 light bg, #0f0f0f dark bg)
- Poppins font throughout
- Smooth transitions (0.35s ease-out)
- Responsive design (mobile, tablet, desktop)
- Dark theme support
- Accessibility (WCAG AA)

---

## Data Flow Architecture

```
User Login
    ↓
Role Identified
    ↓
Backend API fetches role-specific data
    ↓
Dashboard Component loads
    ├── CHRO → Departments + Attrition + Trends
    ├── HR Partner → Employees + History + Insights
    ├── Talent Ops → Skills + Hiring + Mobility
    └── Engagement Manager → Sentiment + Wellness + Alerts
    ↓
Real-time updates via WebSocket
    ↓
AI Insights generated
    ↓
Display with animations
```

---

## Implementation Notes

### Current State
Dashboards exist at their respective routes. This guide explains what data and features each should display based on role.

### Next Steps
1. **Backend Integration**: Wire each dashboard to role-specific API endpoints
2. **Data Population**: Seed realistic data for each role scenario
3. **AI Insights**: Implement algorithms to generate role-specific recommendations
4. **Notifications**: Build alert system for each role's priority areas
5. **Testing**: Test all role flows end-to-end

---

## Role-Specific Routing Code

```typescript
// In AuthContext.tsx after user login
const roleRoutes: Record<UserRole, string> = {
  chro: '/dashboard',
  hr_partner: '/employees',
  talent_ops: '/workforce-insights',
  engagement_manager: '/engagement-analytics',
};

// Automatically route after authentication
useEffect(() => {
  if (user) {
    router.push(roleRoutes[user.role]);
  }
}, [user]);
```

---

## Questions & Next Steps

Contact the product team for:
- Backend API specifications
- Detailed analytics calculations
- AI algorithm requirements
- Mobile design specifications
- Performance benchmarks

