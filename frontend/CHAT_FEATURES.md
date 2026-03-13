# Personalized Chat & Meeting Intelligence Integration

This document describes the enhanced chat feature with behavioral intelligence integration.

## Features

### 1. **Personalized Meeting Preparation**
When you ask "prepare me for a meeting with [name]", the chat will:
- Extract the employee's name
- Fetch their behavioral intelligence profile (if available)
- Provide personalized meeting tips based on:
  - Communication style
  - Motivation drivers
  - Engagement level
  - Collaboration preferences

**Example:**
```
User: "prepare me for a meeting with alice"
Response:
Meeting Prep: Alice
Their style: Direct and collaborative
• Highlight: Recognition and career growth
• They're engaged—bring challenging topics
• Work style: Team-focused with clear outcomes
```

### 2. **Concise AI Responses**
All chat responses are kept brief (2-3 sentences or 3-5 bullet points) for better UX:
- No verbose explanations
- Actionable insights
- Context-aware personalization

### 3. **Chat History Management**
- Chat history is **automatically cleared** when you close the chatbot
- Each session starts fresh - click the chat button to get a new conversation
- No persistent chat storage in browser (for privacy)

### 4. **Behavioral Intelligence Context**
The AI uses live employee data:
- Behavioral profiles (communication style, motivation drivers, feedback preferences)
- Engagement metrics (0-1 scales for engagement, participation, responsiveness, initiative)
- Recent insights from meetings and transcripts

## Frontend Components

### ChatbotButton.tsx
Main chat interface with:
- `isOpen` state management (clears chat on toggle)
- Real-time message display with timestamps
- Loading states for async operations
- Employee data caching to reduce API calls
- Auto-scroll to latest messages

### API Integration (`lib/api.ts`)
```typescript
fetchChat(question: string) // Send chat question to backend
analyzeIntelligence(...) // Analyze behavioral intelligence
getEmployeeSummary(employeeName: string) // Fetch employee data
getIntelligenceHistory(employeeName: string) // Get reports history
```

### Chat Utilities (`lib/chatUtils.ts`)
```typescript
personalizeResponse() // Adapt response based on behavioral data
generateMeetingPrepResponse() // Create meeting prep suggestions
extractEmployeeName() // Parse "prepare me for [name]" pattern
conciseFormat() // Trim responses to reasonable length
```

## Backend Enhancements

### Enhanced `hr_chat()` Function
- Now includes behavioral intelligence data in context
- Formats employee profiles with engagement metrics
- Supports concise mode for brief, actionable responses
- Removes markdown formatting for cleaner UI output

### Response Optimization
```python
def hr_chat(question: str, concise: bool = True):
    # Returns brief, focused responses
    # Includes behavioral intelligence context
    # Formats employee data intelligently
```

## Environment Variables

### Backend (.env)
```
GROQ_API_KEY=your_groq_key
MONGO_URI=your_mongodb_uri
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Usage Examples

### Meeting Preparation
```
"prepare me a meet with rahul"
"get me ready for a meeting with sarah"
"tips for talking with john"
"how should i approach discussion with alice"
```

### General HR Questions
```
"what's the engagement level of the team?"
"who needs career development?"
"highlight high performers"
"any burnout risks?"
```

## Message Flow Diagram

```
User Opens Chat
    ↓
Initial greeting shown
    ↓
User types: "prepare me for meeting with Alice"
    ↓
Frontend detects meeting prep question
    ↓
Extract employee name "Alice"
    ↓
Fetch Alice's behavioral intelligence summary
    ↓
Generate personalized meeting prep response
    ↓
Display response with engagement tips
    ↓
User closes chat
    ↓
All messages cleared from state
```

## API Response Examples

### Meeting Prep Response (Personalized)
```
**Meeting Prep: Alice**
Their style: Direct and results-focused
• Highlight: Career growth opportunity
• They're highly engaged—bring strategic initiatives
• Work style: Independent with collaborative outcomes
```

### Regular Chat Response
```
Based on recent engagement data:
• Top performers: Alice, Bob, Carol (90%+ engagement)
• Some concerns: David showing 45% engagement (follow up recommended)
• Team sentiment: 78% positive
```

## Performance Optimizations

1. **Employee Cache**: Stores fetched employee data to avoid repeated API calls
2. **Debounced Input**: Prevents excessive API calls while typing
3. **Message Timestamps**: Unique IDs and timestamps for React reconciliation
4. **Auto-scroll**: Smooth scroll-to-latest without blocking UI

## Error Handling

- Failed API calls show user-friendly error messages
- Missing employee data gracefully falls back to generic response
- Network errors are caught and displayed
- No sensitive data leaks in error messages

## Testing Examples

### In Browser
```javascript
// Test meeting prep detection
const question = "prepare me for meeting with john";
isMeetingPrepQuestion(question) // true
extractEmployeeName(question) // "john"

// Test response formatting
const longResponse = "Very long response text...";
conciseFormat(longResponse, 2) // Shortened to 2 lines max
```

### cURL Examples
```bash
# Send chat message
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "prepare me for meeting with alice"}'

# Get employee summary
curl -X GET http://localhost:8000/api/intelligence/summary/alice
```

## Future Enhancements

- [ ] Chat history persistence (optional)
- [ ] Export meeting prep as PDF
- [ ] Voice input for chat
- [ ] Multi-language support
- [ ] Suggested follow-up questions
- [ ] Meeting recap auto-generation
- [ ] Real-time collaboration tips during meetings
