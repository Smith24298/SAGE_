# API Debugging Guide - Troubleshoot Chat Issues

## Issue: Chat Not Getting Employee Summary

If the chat feature isn't showing personalized employee data when you ask "prepare me for meeting with [name]", use this guide to diagnose the problem.

---

## Step 1: Check Backend Connection

### Test in Browser Console
```javascript
// Open browser DevTools (F12)
// Go to Console tab
// Paste this:

const API_URL = 'http://localhost:8000';
fetch(`${API_URL}/health`)
  .then(r => r.json())
  .then(d => console.log('✓ Backend connected:', d))
  .catch(e => console.error('✗ Backend not working:', e));
```

**Expected output:**
```
✓ Backend connected: {status: "healthy", service: "HR AI Digital Twin"}
```

**If you see error:**
- Backend not running - start it: `uvicorn backend.main:app --reload`
- Wrong URL - check `.env.local` has correct `NEXT_PUBLIC_API_URL`

---

## Step 2: Check Frontend Logs

1. Open Browser DevTools (F12)
2. Go to **Console** tab
3. Try the chat "prepare me for meeting with alice"
4. Look for these console messages:

### Good Logs (Everything Working)
```
Fetching employee summary from: http://localhost:8000/api/intelligence/summary/alice
[Response from API]
Successfully fetched summary for alice: {behavioral_profile: {...}, engagement_profile: {...}}
```

### Warning Logs (Employee Not Found)
```
Fetching employee summary from: http://localhost:8000/api/intelligence/summary/alice
API response not ok: 404 Not Found
Employee not found: alice
```
**Solution:** Employee hasn't been analyzed yet. Upload a transcript with this employee name first.

### Error Logs (API Issue)
```
Summary API error: TypeError: fetch failed
```
**Solutions:**
1. Backend not running - Start it
2. Wrong API URL - Check `.env.local`
3. CORS issues - Check backend accepts requests

---

## Step 3: Use Debug Function

### In Browser Console:
```javascript
// Import debug function
import { debugEmployeeSummary } from '@/lib/api';

// Run diagnostic
await debugEmployeeSummary('alice');
```

**Output:**
```
Debug: getEmployeeSummary("alice")
API_BASE_URL: http://localhost:8000
Employee name: "alice"
Encoded name: "alice"
API Health: ✓
Result: {behavioral_profile: {...}, ...}
```

---

## Step 4: Direct API Test

### Using cURL (Terminal)

```bash
# Test 1: Health check
curl http://localhost:8000/health

# Expected: {"status":"healthy","service":"HR AI Digital Twin"}
```

```bash
# Test 2: Get employee summary
curl http://localhost:8000/api/intelligence/summary/alice

# Expected: 
# {"status":"success","summary":{...behavioral and engagement data...}}

# If not found:
# {"status":"error","message":"No intelligence data found for alice"}
```

```bash
# Test 3: Chat endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "who needs support?"}'

# Expected: {"response":"...concise AI response..."}
```

---

## Common Issues & Solutions

### Issue 1: Employee Not Found

**Symptom:**
```
API response not ok: 404 Not Found
Employee not found: [name]
```

**Solution:**
1. The employee doesn't exist in the database yet
2. Upload a meeting transcript containing this person
3. Next time you ask "prepare me for meeting with [name]", they'll have data

**To Add Test Data:**
```bash
curl -X POST http://localhost:8000/api/analyze/intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "employee_name": "Alice Smith",
    "personality_data": {
      "mbti": "ENTJ",
      "traits": ["leadership", "analytical"]
    },
    "transcript": "Alice said: I think we should streamline this process.",
    "store_in_db": true,
    "update_twin": true
  }'
```

---

### Issue 2: Response from Wrong Endpoint

**Symptom:**
Chat gets a general response instead of personalized meeting prep

**Diagnosis:**
```javascript
// Check what endpoint is being called
// Open DevTools Console
// Should see: "Fetching employee summary from: http://localhost:8000/api/intelligence/summary/alice"
// If you see something else, there's a routing issue
```

**Solution:**
1. Verify backend has this endpoint: `GET /api/intelligence/summary/{employee_name}`
2. Check `backend/main.py` around line 195
3. Restart backend: `uvicorn backend.main:app --reload`

---

### Issue 3: Timeout

**Symptom:**
```
AbortError: The operation was aborted
```

**Solution:**
- API calls time out after 10 seconds
- Backend might be slow
- Check if MongoDB connection is working
- Verify MongoDB credentials in `.env`

---

### Issue 4: Empty Response

**Symptom:**
Response displays but with no employee data

**Possible Causes:**

1. **Employee exists but no behavioral data:**
   - Upload a transcript with more context
   - Analysis needs: communication patterns, engagement signals

2. **Malformed API response:**
   - Check DevTools for: "Response missing summary field"
   - Backend might be returning unexpected structure

---

## Step-by-Step Debugging Flow

```
1. Open DevTools (F12)
   ↓
2. Go to Console tab
   ↓
3. Try: "prepare me for meeting with alice"
   ↓
4. Check console logs
   ↓
5. If error, use cURL to test backend directly
   ↓
6. If backend works but frontend doesn't, check .env.local
   ↓
7. If still broken, run debugEmployeeSummary() function
```

---

## Network Tab Analysis

For advanced debugging:

1. Open DevTools → **Network** tab
2. Type chat message "prepare me for meeting with alice"
3. Look for requests:
   - `https://localhost:3000/...` (frontend requests)
   - `http://localhost:8000/...` (backend requests)

### Good Response (Status 200)
```
Request: GET /api/intelligence/summary/alice
Status: 200
Response: {"status": "success", "summary": {...}}
```

### Not Found (Status 404)
```
Request: GET /api/intelligence/summary/alice
Status: 404
Response: {"status": "error", "message": "No intelligence data found for alice"}
```

### Server Error (Status 500)
```
Request: GET /api/intelligence/summary/alice
Status: 500
Response: {"status": "error", "message": "...error details..."}
```

---

## Full Environment Check

### Verify Backend `.env`:
```bash
cd backend
cat .env

# Should have:
# GROQ_API_KEY=...
# MONGO_URI=...
```

### Verify Frontend `.env.local`:
```bash
cd frontend
cat .env.local

# Should have:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Test Backend Directly:
```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
uvicorn backend.main:app --reload

# Terminal 2: Test in new terminal
curl http://localhost:8000/health
# Should show: {"status":"healthy",...}
```

### Test Frontend:
```bash
# Terminal 3: Start frontend
cd frontend
npm run dev

# Open http://localhost:3000
# Check DevTools console for any errors
```

---

## Log Format Guide

### Console Prefix Meanings

| Prefix | Meaning | Action |
|--------|---------|--------|
| `Fetching from:` | API call starting | Normal, check response next |
| `Successfully fetched:` | Got good data | ✓ Everything working |
| `API response not ok:` | Error from backend | Check status code |
| `Employee not found:` | 404 response | Add employee data |
| `Response missing:` | Bad response format | Backend issue |
| `Chat response:` | Got chat response | ✓ Chat working |
| `Error:` | Exception thrown | Check error message |

---

## Quick Reference: Expected Flows

### Scenario: "prepare me for meeting with alice"

**Expected Console:**
```
1. Fetching employee summary from: http://localhost:8000/api/intelligence/summary/alice
2. Successfully fetched summary for alice: {...}
3. [Chat displays personalized meeting prep]
```

**If Step 2 Shows:**
```
API response not ok: 404 Not Found
Employee not found: alice
```
→ Alice doesn't have behavioral data yet. Need to analyze her first.

### Scenario: "what's the team's engagement?"

**Expected Console:**
```
1. Sending to chat endpoint: what's the team's engagement?
2. Chat response: Team engagement metrics show...
3. [Chat displays response]
```

**If Gets Error:**
```
Chat API error: Error: Chat API error: 400 Bad Request
```
→ Check backend `/chat` endpoint is working

---

## Still Having Issues?

1. **Gather this info:**
   - Console output (copy the full log)
   - `.env.local` contents (hide secrets)
   - Backend server output
   - Network tab response

2. **Check these files:**
   - `frontend/src/lib/api.ts` - API client implementation
   - `backend/main.py` - Backend endpoints (line 195+)
   - `backend/rag/hr_assistant.py` - Chat implementation

3. **Run diagnostics:**
   ```bash
   # In browser console:
   import { checkApiHealth, debugEmployeeSummary } from '@/lib/api';
   await checkApiHealth();
   await debugEmployeeSummary('test-employee');
   ```
