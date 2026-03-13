# Complete API Integration Example

This example shows how the frontend chat integrates with backend behavioral intelligence.

## Full User Journey

### Step 1: User Opens Chat
```typescript
// User clicks chat button
// ChatbotButton.tsx: isOpen = true
// useEffect clears previous messages and shows greeting
```

**Screen shows:**
```
┌─────────────────────────────────┐
│  SAGE AI Assistant              │
│  Personalized HR Intelligence   │
├─────────────────────────────────┤
│                                 │
│ Hey! I'm SAGE, your HR AI      │
│ assistant. I can help with:    │
│ • Meeting prep                 │
│ • Employee insights            │
│ • Engagement analysis          │
│ • Workforce recommendations    │
│                                 │
├─────────────────────────────────┤
│ [Type message...] [Send]        │
│ Chat clears when closed         │
└─────────────────────────────────┘
```

### Step 2: User Asks Meeting Prep Question
```typescript
// User types: "prepare me for a meeting with rahul"
// Calls handleSendMessage()

// Frontend logic:
1. Create user message
2. Add to messages state (displays immediately)
3. Check isMeetingPrepQuestion() → TRUE
4. Extract "rahul" with extractEmployeeName()
5. Try to getEmployeeSummary("rahul")
6. Generate personalized meeting prep response
7. Add assistant message to state
```

**Backend Flow (getEmployeeSummary):**
```
GET /api/intelligence/summary/rahul

Response example:
{
  "status": "success",
  "summary": {
    "employee": "Rahul",
    "behavioral_profile": {
      "communication_style": "Direct and action-oriented",
      "personality_summary": "Natural leader with analytical mindset",
      "motivation_drivers": ["Recognition", "Career growth"],
      "feedback_preference": "Direct, data-driven feedback",
      "collaboration_style": "Team-focused with clear goals"
    },
    "engagement_profile": {
      "engagement_level": 0.85,
      "participation": 0.88,
      "responsiveness": 0.90,
      "initiative": 0.92,
      "key_signals": ["proactive", "engaged", "strategic"],
      "reasoning": "High engagement across all metrics"
    },
    "last_updated": "2024-03-13T10:30:00Z"
  }
}
```

**Frontend Processing:**
```typescript
// In generateMeetingPrepResponse():
const response = `
**Meeting Prep: Rahul**
Their style: Direct and action-oriented
• Highlight: Recognition for strategic leadership
• They're engaged—bring challenging, strategic topics
• Work style: Team-focused with clear outcomes
`;

// Via personalizeResponse():
- Detect direct style → Keep response direct
- Detect "Recognition" driver → Emphasize achievements
- Detect high engagement (0.85) → Suggest challenging topics
- Detect high initiative (0.92) → Frame as decision maker

// Via conciseFormat():
- Trim to 3 lines max
- Keep under 100 chars per line
```

**Screen shows:**
```
┌─────────────────────────────────┐
│ You: prepare me for meeting...  │
│                                 │
│ 2:34 PM                         │
│                                 │
│ Meeting Prep: Rahul             │
│ Their style: Direct and...      │
│ • Highlight: Recognition...     │
│ • They're engaged—bring...      │
│ • Work style: Team-focused...   │
│                                 │
│ 2:35 PM                         │
│                                 │
├─────────────────────────────────┤
│ [Type message...] [Send]        │
└─────────────────────────────────┘
```

### Step 3: User Asks General Question
```typescript
// User types: "who needs support this week?"
// Calls handleSendMessage()

// Check isMeetingPrepQuestion() → FALSE
// Calls fetchChat() to backend
```

**Backend Flow (POST /chat):**
```
Request:
{
  "question": "who needs support this week?"
}

Backend hr_chat() logic:
1. Fetch all employee digital twins
2. Build context with behavioral intelligence:
   - Alice: Engagement 0.85, Participation 0.90, Drivers: [Recognition, Growth]
   - Rahul: Engagement 0.85, Participation 0.88, Drivers: [Recognition, Career]
   - Jennifer: Engagement 0.35, Participation 0.40, Drivers: [Stability]
   - ...

3. Send to LLM with prompt:
   "You are an HR assistant with this employee data...
    Question: who needs support this week?
    Keep response very concise (2-3 sentences max)"

4. LLM returns concise response:
   "Jennifer needs immediate support (35% engagement).
    David shows low participation but high responsiveness—empower him.
    Alice and Rahul are thriving, could mentor others."

5. Remove markdown, trim to 5 lines max
6. Return response
```

**Response received in frontend:**
```typescript
// Response displays in chat
// Auto-scrolls to bottom
// Timestamp added (2:36 PM)
```

**Screen shows:**
```
┌─────────────────────────────────┐
│ You: who needs support this...  │
│ 2:35 PM                         │
│                                 │
│ Jennifer needs immediate...     │
│ David shows low participation   │
│ Alice and Rahul are thriving    │
│                                 │
│ 2:36 PM                         │
│                                 │
├─────────────────────────────────┤
│ [Type message...] [Send]        │
└─────────────────────────────────┘
```

### Step 4: Multiple Messages
```typescript
// User can continue asking questions
// Each one follows same flow
// Messages stack with timestamps
// Loading spinner shows during processing
```

### Step 5: User Closes Chat
```typescript
// User clicks X button
// isOpen = false
// useEffect runs: setMessages([]) → Chat cleared
```

**Screen shows:**
```
Chat closed, back to normal page
(Chat history is gone)
```

### Step 6: User Opens Chat Again
```typescript
// User clicks chat button again
// isOpen = true
// useEffect runs: messages.length === 0
// Shows fresh greeting again
```

## Code Flow Diagram

```
User Input
    ↓
handleSendMessage()
    ├─→ Create User Message
    ├─→ Add to messages state
    ├─→ Clear input field
    │
    ├─→ isMeetingPrepQuestion()?
    │   ├─ YES: Process Meeting Prep
    │   │   ├─ extractEmployeeName()
    │   │   ├─ getEmployeeSummary() [API call]
    │   │   ├─ generateMeetingPrepResponse()
    │   │   └─ personalizeResponse()
    │   │
    │   └─ NO: Process Chat
    │       ├─ fetchChat() [API call]
    │       └─ personalizeResponse() [optional]
    │
    ├─→ conciseFormat() response
    ├─→ Create Assistant Message
    ├─→ Add to messages state
    └─→ messagesEndRef scrolls into view

State Update
    ↓
Component Re-render
    ↓
All Messages Displayed with Animations
    ↓
Auto-scroll to Latest Message
```

## Performance Timeline

```
User types "prepare me for meeting with alice"
|
├─ 0ms: Form submit detected
├─ 10ms: User message state updated (renders immediately)
├─ 50ms: Meeting prep detected, extraction happens
├─ 100ms: API call to getEmployeeSummary() starts
│
├─ 400-600ms: Backend response received
│
├─ 650ms: Response personalized and formatted
├─ 700ms: Assistant message state updated
├─ 750ms: Component re-renders with new message
├─ 800ms: Auto-scroll animation completes
|
Total: ~800ms from input to display
```

## Error Handling Flow

```
User submits question
    ↓
try block starts
    ├─ isMeetingPrepQuestion check
    │   └─ Try getEmployeeSummary()
    │       └─ catch (error) → generateMeetingPrepResponse(null)
    │           └─ Falls back to generic meeting prep
    │
    └─ Try fetchChat() call
        └─ catch (error) → Error message displayed
            └─ "Sorry, I encountered an error. Please try again."

Finally block:
    └─ setIsLoading(false)
    └─ Re-enable input field
```

## Data Flow Example: Personalization

```
Raw Backend Response:
"Based on the employee data you provided, I would recommend
taking a direct approach to communication given Alice's
communication style preference..."

↓ (conciseFormat - trim to 3 lines)

"Based on the employee data, take a direct approach to
communication given Alice's preference..."

↓ (personalizeResponse - detect direct preference)

Remove conversational filler, keep action-focused

↓ (Final Display)

"Take a direct approach to communication.
Alice prefers clear, focused discussions.
Focus on outcomes."

Final length: ~100 characters, easy to read
```

## State Management

### ChatbotButton Component State

```typescript
{
  isOpen: boolean,           // Chat window visible
  messages: Message[],       // Chat history (cleared on toggle)
  input: string,             // Current input value
  isLoading: boolean,        // API call in progress
  employeeCache: Record<>    // Cached employee summaries
}
```

### Message Type Structure

```typescript
{
  id: string,                  // Unique identifier
  type: 'user' | 'assistant',  // Message sender
  content: string,            // Message text
  timestamp: Date             // When sent
}
```

## API Integration Summary

| Action | Endpoint | Method | Cache | Timeout |
|--------|----------|--------|-------|---------|
| Chat | `/chat` | POST | No | 10s |
| Employee Data | `/api/intelligence/summary/:name` | GET | Yes | 5m |
| History | `/api/intelligence/history/:name` | GET | No | 1m |

## Testing Scenarios

### Scenario 1: Happy Path - Meeting Prep
```
Input: "prepare me for meeting with alice"
Expected: Personalized meeting prep with Alice's engagement data
Status: ✅ Working
```

### Scenario 2: Generic Question
```
Input: "what should i do about low team engagement?"
Expected: Concise recommendation from backend
Status: ✅ Working
```

### Scenario 3: Badge Employee Name
```
Input: "prepare me for a meeting with bob smith"
Expected: Extracted name handled
Status: ✅ Working (extracts "bob smith")
```

### Scenario 4: No Employee Data
```
Input: "prepare me for meeting with NewHire"
Expected: Generic meeting prep (no cached data)
Status: ✅ Working gracefully
```

### Scenario 5: Toggle Chat
```
Action: Close and reopen chat
Expected: All messages cleared
Status: ✅ Working
```

## Deployment Considerations

- **API URL**: Must be accessible from frontend origin
- **CORS**: May need configuration if on different domains
- **Environment**: Set `NEXT_PUBLIC_API_URL` before build
- **Caching**: Employee data cached in browser session only
- **Privacy**: No chat history persisted
