import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, USER_ROLE_ROUTES } from '@/context/AuthContext';

export function useRoleBasedNavigation() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // No role yet -> role selection
    if (user.role == null) {
      if (!router.pathname.startsWith('/auth/role-selection')) {
        router.push('/auth/role-selection');
      }
      return;
    }

    const dashboardRoute = USER_ROLE_ROUTES[user.role] ?? '/dashboard';

    if (router.pathname.startsWith('/auth/')) {
      router.push(dashboardRoute);
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
}

// Wrapper component to protect routes
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRoleBasedNavigation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
