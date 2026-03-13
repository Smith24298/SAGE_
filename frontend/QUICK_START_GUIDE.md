#!/usr/bin/env node

# SAGE Authentication System - Quick Start Guide

## 🚀 Quick Start

### 1. Start Your Dev Server
```bash
cd frontend
npm run dev
```

### 2. Access Sign In Page
```
http://localhost:3000/auth/signin
```

### 3. Test Flow
- **Sign In**: Use mock credentials (any email/password - it's not validated in dev mode)
- **Sign Up**: Create new account with email and password
- **Role Selection**: Choose one of 4 roles
- **Dashboard**: Auto-redirect to role-specific dashboard

---

## 📁 New Files Created

### Context
- `src/context/AuthContext.tsx` - Global auth state management

### Pages
- `src/pages/auth/signin.tsx` - Sign in page
- `src/pages/auth/signup.tsx` - Sign up page
- `src/pages/auth/role-selection.tsx` - Role selection UI
- Updated `src/pages/_app.tsx` - Route protection

### Components
- `src/app/components/LogoutButton.tsx` - Logout button component

### Hooks
- `src/hooks/useRoleBasedNavigation.ts` - Navigation utilities

### Documentation
- `AUTH_SYSTEM_DOCUMENTATION.md` - Complete auth guide
- `DASHBOARD_ROLES_GUIDE.md` - Role-specific dashboard specs
- This file

---

## 🎯 Core Concepts

### Authentication Flow
```
User → Sign In/Up → Role Selection → Dashboard
```

### Role-Based Routing
```typescript
// After login, automatically route to:
- CHRO → /dashboard
- HR Business Partner → /employees
- Talent Operations → /workforce-insights
- Engagement Manager → /engagement-analytics
```

### State Persistence
```javascript
// User data stored in localStorage
localStorage.user = {
  id: string,
  name: string,
  email: string,
  role: 'chro' | 'hr_partner' | 'talent_ops' | 'engagement_manager'
}
```

---

## 💻 Usage Examples

### Access User in Any Component
```typescript
import { useAuth } from '@/context/AuthContext';

export function MyComponent() {
  const { user } = useAuth();
  
  return <p>Hello, {user?.name}! Your role: {user?.role}</p>;
}
```

### Check User Authentication
```typescript
import { useAuth } from '@/context/AuthContext';

export function Protected() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <p>Loading...</p>;
  if (!user) return <p>Not authenticated</p>;
  
  return <p>Welcome!</p>;
}
```

### Logout
```typescript
import { useAuth } from '@/context/AuthContext';

export function LogoutExample() {
  const { logout } = useAuth();
  
  return (
    <button onClick={logout}>Sign Out</button>
  );
}
```

### Add Logout Button to Navbar
```typescript
// In src/app/components/Navbar.tsx
import { LogoutButton } from './LogoutButton';

export function Navbar() {
  return (
    <nav>
      {/* ... existing navbar content ... */}
      <LogoutButton />
    </nav>
  );
}
```

---

## 🔌 Backend Integration Checklist

### 1. Replace Mock Login
File: `src/context/AuthContext.tsx`

**Current (Mock):**
```typescript
const login = async (email: string, password: string) => {
  // Simulated delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock user
  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: email,
    role: 'chro',
  };
  
  setUser(mockUser);
  localStorage.setItem('user', JSON.stringify(mockUser));
};
```

**To Replace with Backend:**
```typescript
const login = async (email: string, password: string) => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Store JWT if provided
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Implement JWT Token Handling
```typescript
// Add to AuthContext.tsx
const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Use in API calls
const response = await fetch('/api/data', {
  headers: getAuthHeader(),
});
```

### 3. Add Token Refresh Logic
```typescript
useEffect(() => {
  // Refresh token every 30 minutes
  const interval = setInterval(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
      } else {
        // Token expired, logout
        logout();
      }
    } catch (error) {
      console.error('Token refresh failed', error);
    }
  }, 30 * 60 * 1000);
  
  return () => clearInterval(interval);
}, []);
```

### 4. Required Backend Endpoints

```typescript
// Sign In
POST /api/auth/signin
Request:  { email: string; password: string }
Response: { user: User; token: string }

// Sign Up
POST /api/auth/signup
Request:  { name: string; email: string; password: string }
Response: { user: User; token: string }

// Update Role
PUT /api/auth/role
Request:  { role: UserRole }
Response: { user: User }

// Verify Token
GET /api/auth/verify
Headers:  { Authorization: Bearer TOKEN }
Response: { user: User }

// Logout (optional, mainly client-side)
POST /api/auth/logout
```

---

## 🎨 Theme Integration

### Auth Pages Auto-Support Themes
Both dark and light themes work automatically on auth pages:

```typescript
// Theme toggle already implemented
// Stored in localStorage
localStorage.theme = 'light' | 'dark'

// Applied to document
document.documentElement.classList.add('dark-theme')
```

### To Add Theme Support to Existing Dashboards
```typescript
// In your dashboard component
useEffect(() => {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-theme');
  }
}, []);
```

---

## 🧪 Testing Scenarios

### Test 1: Complete Signup Flow
1. Go to `/auth/signup`
2. Fill form with test data
3. Click "Sign Up"
4. Select a role
5. Should redirect to `/dashboard` (or role-specific)
6. Refresh page - user should persist

### Test 2: Login Flow
1. Go to `/auth/signin`
2. Enter any credentials (mock mode)
3. Click "Sign In"
4. Should redirect to dashboard
5. Open DevTools → Application → localStorage
6. Verify `user` is stored

### Test 3: Theme Persistence
1. On auth page, click theme toggle
2. Switch between light/dark
3. Refresh page - theme should persist
4. Navigate to dashboard - theme should follow

### Test 4: Logout
1. Login to dashboard
2. Click logout button (add to navbar)
3. Should redirect to `/auth/signin`
4. localStorage should be cleared

### Test 5: Protected Routes
1. Try accessing `/dashboard` without login
2. Should redirect to `/auth/signin`
3. Try accessing `/auth/signin` when logged in
4. Should redirect to dashboard

---

## 🐛 Common Issues & fixes

### Issue: Blank Page on `/dashboard`
**Cause**: User not authenticated but no redirect  
**Fix**: Check `_app.tsx` redirect logic is running

### Issue: Theme not Persisting
**Cause**: localStorage not set properly  
**Fix**: Check dark-theme class is on `document.documentElement`

### Issue: Infinite Loading
**Cause**: `isLoading` state stuck true  
**Fix**: Ensure `setIsLoading(false)` in finally blocks

### Issue: Role Selection Not Working
**Cause**: User not set before navigation  
**Fix**: Verify signup() completes before redirecting to role selection

### Issue: localStorage User Not Loading
**Cause**: App initializing before localStorage read  
**Fix**: Wrapped in useEffect with mount check

---

## 📱 Responsive Design

Auth pages are fully responsive:
- Mobile (< 768px): Stack layout, full-width form
- Tablet (768-1024px): 50/50 split, smaller text
- Desktop (> 1024px): Full split layout as designed

The right-side animated illustration hides on mobile using `hidden lg:flex`.

---

## ♿ Accessibility Features

- Semantic HTML (`<form>`, `<label>`, `<input>`)
- Keyboard navigation (Tab through fields)
- Focus states with `focus:border-primary focus:outline-none`
- Error messages linked to inputs (for screen readers)
- Color not only indicator (checkmarks, icons included)
- Sufficient contrast (WCAG AA)

---

## 📊 Monitoring

### Console Logs to Watch
```javascript
// Auth state changes
console.log('User:', user);
console.log('Role:', user?.role);
console.log('Loading:', isLoading);

// Navigation
console.log('Route:', router.pathname);

// Storage
console.log('localStorage.user:', localStorage.getItem('user'));
```

---

## 🚀 Production Checklist

Before deploying:
- [ ] Replace mock auth with real backend
- [ ] Implement JWT token management
- [ ] Add HTTPS enforcement
- [ ] Enable CORS properly
- [ ] Add rate limiting on auth endpoints
- [ ] Implement email verification
- [ ] Add password reset flow
- [ ] Setup 2FA (optional)
- [ ] Test all role flows
- [ ] Test theme persistence
- [ ] Verify localStorage privacy
- [ ] Check Lighthouse score
- [ ] Test on mobile devices
- [ ] Verify dark mode on all pages
- [ ] Add analytics tracking

---

## 🔐 Security Notes

### Current (Development Only)
- localStorage used for demo purposes
- No encryption
- Mock credentials accepted
- No backend validation

### Production Requirements
- Use HTTP-only cookies for tokens
- Implement CSRF protection
- Add password hashing (bcrypt)
- Enforce HTTPS only
- Implement rate limiting
- Add request signing
- Use environment variables for secrets
- Monitor for suspicious activity

---

## 🆘 Need Help?

### Debugging Tips
1. Check browser console for errors
2. Check Network tab for API calls (after backend integration)
3. Check localStorage in DevTools
4. Check route in address bar
5. Check `user` object in context

### Quick Checks
```javascript
// In browser console
// Check if user exists
localStorage.getItem('user')

// Check if theme is saved
localStorage.getItem('theme')

// Clear all auth data
localStorage.removeItem('user')
localStorage.removeItem('authToken')
localStorage.removeItem('theme')
```

---

## 📚 Related Files

- `AUTH_SYSTEM_DOCUMENTATION.md` - Detailed architecture
- `DASHBOARD_ROLES_GUIDE.md` - Role-specific features
- `src/context/AuthContext.tsx` - State management
- `src/pages/_app.tsx` - App wrapper
- `src/pages/auth/*.tsx` - Auth pages

---

## ✅ Version Info

- Created: March 13, 2026
- Next.js: 15+
- React: 18+
- Tailwind CSS: Latest
- Framer Motion: motion/react
- Icons: lucide-react

Enjoy! 🎉

