import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const roleRoutes: Record<string, string> = {
  chro: '/dashboard', // CHRO sees main dashboard with executive insights
  hr_partner: '/employees', // HR Partner sees employees
  talent_ops: '/workforce-insights', // Talent Ops sees workforce insights
  engagement_manager: '/engagement-analytics', // Engagement manager sees engagement
};

export function useRoleBasedNavigation() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // If no user, redirect to sign in
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Get the role-specific dashboard route
    const dashboardRoute = roleRoutes[user.role] || '/dashboard';

    // If accessing auth pages while logged in
    if (router.pathname.startsWith('/auth/')) {
      router.push(dashboardRoute);
      return;
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
