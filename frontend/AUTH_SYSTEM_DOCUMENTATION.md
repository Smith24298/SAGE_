# SAGE Authentication & Role-Based Routing System

## Overview

This document outlines the complete authentication and role-based dashboard routing system for the SAGE HR platform.

---

## Architecture

### Core Components

#### 1. **AuthContext** (`src/context/AuthContext.tsx`)
- **Purpose**: Manages global authentication state
- **Responsibilities**:
  - User authentication (login/signup)
  - Role management
  - Session persistence via localStorage
  - Loading states

#### 2. **Authentication Pages**
- **Sign In** (`src/pages/auth/signin.tsx`) - User login
- **Sign Up** (`src/pages/auth/signup.tsx`) - New account creation
- **Role Selection** (`src/pages/auth/role-selection.tsx`) - Role assignment after signup
- **Forgot Password** (optional) - Password recovery

#### 3. **Application Wrapper** (`src/pages/_app.tsx`)
- Wraps entire app with AuthProvider
- Handles route protection and redirection
- Prevents unauthorized access to dashboards

---

## User Roles & Dashboard Routing

### Role Mappings

| Role ID | Role Name | Dashboard Route | Focus Area |
|---------|-----------|-----------------|-----------|
| `chro` | Chief Human Resources Officer | `/dashboard` | Strategic insights, executive overview |
| `hr_partner` | HR Business Partner | `/employees` | Employee profiles, relationships |
| `talent_ops` | Talent Operations Manager | `/workforce-insights` | Hiring, skill gaps, mobility |
| `engagement_manager` | Employee Engagement Manager | `/engagement-analytics` | Sentiment, burnout, well-being |

### Routing Logic

```typescript
const roleRoutes: Record<string, string> = {
  chro: '/dashboard',
  hr_partner: '/employees',
  talent_ops: '/workforce-insights',
  engagement_manager: '/engagement-analytics',
};
```

After login/signup, users are automatically routed to their role-specific dashboard.

---

## Authentication Flow

### Sign Up Flow

```
1. User visits /auth/signup
   ↓
2. Fills form (name, email, password, confirm)
   ↓
3. Submission triggers signup() in AuthContext
   ↓
4. Backend creates user account
   ↓
5. User stored in localStorage
   ↓
6. Redirect to /auth/role-selection
   ↓
7. User selects role from 4 cards
   ↓
8. setRole() updates user role in context
   ↓
9. Redirect to role-specific dashboard (e.g., /dashboard for CHRO)
```

### Sign In Flow

```
1. User visits /auth/signin
   ↓
2. Enters email & password
   ↓
3. Submission triggers login() in AuthContext
   ↓
4. Backend validates credentials
   ↓
5. User + role returned and stored
   ↓
6. Redirect to role-specific dashboard
```

### Protected Route Access

```
1. User tries to access /dashboard without auth
   ↓
2. useAuth() hook detects no user
   ↓
3. useEffect in _app.tsx triggers
   ↓
4. Redirect to /auth/signin
   ↓
5. After login, redirect to appropriate dashboard based on role
```

---

## UI/UX Design System

### Theme Integration

All auth pages respect the **light/dark theme toggle**:
- Light theme: `#e9eae2` background
- Dark theme: `#0f0f0f` background with `#1a1a1a` cards
- Both preserve: Primary color `#e1634a`, Typography `Poppins`

### Sign In Page Layout

```
┌─────────────────────────────────────────────────┐
│ ☀️/🌙                                            │
├──────────────────┬──────────────────────────────┤
│                  │                              │
│   Sign In Form   │  Animated Analytics Card     │
│                  │  - Team Engagement: 79%      │
│   • Email        │  - Retention Rate: 92%      │
│   • Password     │  - Burnout Risk: 14%        │
│   • Remember Me  │                              │
│   [Sign In →]    │                              │
│                  │  Real-time insights powered  │
│  Sign Up Link    │  by AI                       │
│                  │                              │
└──────────────────┴──────────────────────────────┘
```

### Sign Up Page Layout

```
Same layout as Sign In, with:
- Additional fields (Name, Confirm Password)
- Feature list on right side instead of analytics
- Links to existing features
```

### Role Selection Page

```
┌──────────────────────────────────────────────────┐
│ ☀️/🌙                                             │
├──────────────────────────────────────────────────┤
│                                                  │
│           Select Your Role                      │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐       │
│  │ 👑              │  │ 👥              │       │
│  │ CHRO            │  │ HR Business     │       │
│  │ Strategic...    │  │ Supporting...   │       │
│  │ [selected ✓]    │  │                 │       │
│  └─────────────────┘  └─────────────────┘       │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐       │
│  │ 💼              │  │ ❤️              │       │
│  │ Talent Ops      │  │ Engagement      │       │
│  │ Managing...     │  │ Ensuring...     │       │
│  │                 │  │                 │       │
│  └─────────────────┘  └─────────────────┘       │
│                                                  │
│              [Continue to Dashboard →]          │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Component Specifications

### Sign In Page (`signin.tsx`)

**Key Features:**
- Theme toggle (top-right corner)
- Split layout (40% form, 60% animated dashboard preview)
- Email & password inputs with focus states
- Remember me checkbox
- Forgot password link
- Sign up redirect
- Smooth animations on load
- Error handling UI

**Animations:**
- Page fade-in: 0.5s ease-out
- Form slide from left
- Analytics bars animate on load (staggered)
- Hover effects on buttons

### Sign Up Page (`signup.tsx`)

**Key Features:**
- Same layout as Sign In for consistency
- Form validation (password matching, min length)
- Feature list on right side
- Error messages for validation
- Sign in redirect

**Validation:**
- All fields required
- Password min 8 characters
- Passwords must match
- Email format validation

### Role Selection Page (`role-selection.tsx`)

**Key Features:**
- Full-width layout (no split)
- Header with user welcome message
- 4 role cards in 2x2 grid (responsive)
- Each card shows icon, title, description, features
- Click to select with visual feedback
- Selected state shows checkmark
- Continue button (disabled until role selected)
- Smooth card animations

**Role Card Details:**

1. **CHRO** (Crown icon)
   - Executive dashboard
   - Attrition alerts
   - Strategic insights

2. **HR Business Partner** (Users icon)
   - Employee profiles
   - Meeting assistant
   - Interaction history

3. **Talent Operations Manager** (Briefcase icon)
   - Skill gap analysis
   - Mobility insights
   - Hiring recommendations

4. **Employee Engagement Manager** (Heart icon)
   - Sentiment tracking
   - Burnout detection
   - Feedback analysis

---

## Backend Integration Points

### Key API Endpoints (to implement)

```typescript
// Sign In
POST /api/auth/signin
{
  email: string;
  password: string;
}
Response: {
  user: { id, name, email, role };
  token: string;
}

// Sign Up
POST /api/auth/signup
{
  name: string;
  email: string;
  password: string;
}
Response: {
  user: { id, name, email };
  token: string;
}

// Update Role (after role selection)
PUT /api/auth/role
{
  role: UserRole;
}
Response: {
  user: { id, name, email, role };
}

// Verify Token
GET /api/auth/verify
Response: {
  user: { id, name, email, role };
}
```

### Current Implementation

Currently using **mock authentication** with localStorage:
- User data stored in `localStorage.user`
- No backend API calls
- Simulated 800ms delays for UX feel

**To connect to real backend:**
1. Replace mock `login()` function with actual API call
2. Replace mock `signup()` function with actual API call
3. Add token management (JWT)
4. Implement refresh token logic

---

## Session Management

### State Persistence

User session persists via localStorage:

```typescript
// Stored in localStorage
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "chro"
  }
}
```

### Session Recovery

On app load:
1. Check `localStorage.user`
2. If exists, restore user to context
3. Skip auth pages, route to dashboard
4. If not exists, redirect to `/auth/signin`

---

## Security Considerations

### Current (Development)

- Uses localStorage (NOT secure for sensitive data)
- No token validation
- Mock authentication

### Production Requirements

- Implement JWT tokens
- HTTP-only cookies for tokens
- Token refresh mechanism
- CSRF protection
- Password hashing on backend
- Rate limiting on auth endpoints
- Email verification
- 2FA support

---

## File Structure

```
src/
├── pages/
│   ├── auth/
│   │   ├── signin.tsx
│   │   ├── signup.tsx
│   │   ├── role-selection.tsx
│   │   └── forgot-password.tsx (optional)
│   ├── dashboard/
│   │   └── (existing dashboards by role)
│   └── _app.tsx (updated with auth)
├── context/
│   └── AuthContext.tsx (NEW)
├── hooks/
│   └── useRoleBasedNavigation.ts (NEW)
└── styles/
    └── theme.css (existing)
```

---

## Implementation Checklist

- [x] AuthContext with login/signup/logout
- [x] Sign In page with SaaS layout
- [x] Sign Up page with validation
- [x] Role Selection page with 4 cards
- [x] _app.tsx route protection
- [x] Theme toggle on auth pages
- [x] localStorage persistence
- [x] Role-based dashboard routing
- [ ] Backend API integration
- [ ] JWT token management
- [ ] Password reset flow
- [ ] Email verification
- [ ] 2FA setup

---

## Usage Examples

### Access User in Any Component

```typescript
import { useAuth } from '@/context/AuthContext';

export function MyComponent() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protect Routes

```typescript
import { useRoleBasedNavigation, ProtectedRoute } from '@/hooks/useRoleBasedNavigation';

export default function MyDashboard() {
  const { user } = useRoleBasedNavigation();
  
  return (
    <ProtectedRoute>
      <h1>Dashboard for {user?.role}</h1>
    </ProtectedRoute>
  );
}
```

---

## Theme Consistency

All auth pages maintain your existing design system:
- **Font**: Poppins (all text)
- **Primary Color**: #e1634a (buttons, accents)
- **Light Background**: #e9eae2
- **Dark Background**: #0f0f0f
- **Cards**: #f5f6f1 (light), #1a1a1a (dark)
- **Text**: #414240 (light), #f5f5f5 (dark)
- **Transitions**: 0.35s ease-out (smooth, not rigid)

---

## Next Steps

1. Test auth flows in browser
2. Verify theme toggle works across auth pages
3. Test role selection and dashboard routing
4. Connect to real backend API
5. Implement JWT token management
6. Add email verification
7. Add password reset flow
8. Set up 2FA (optional)

