import type { AppProps } from "next/app";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import '@/styles/index.css';

import { Layout } from '@/app/components/Layout';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Auth pages that should NOT have the Layout wrapper
const authPages = ['/auth/signin', '/auth/signup', '/auth/role-selection', '/auth/forgot-password', '/test-login'];

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    const isAuthPage = authPages.includes(router.pathname);

    // Redirect logic
    if (!user && !isAuthPage) {
      // User not logged in, redirect to signin (except on auth pages)
      router.push('/auth/signin');
    } else if (user && isAuthPage && router.pathname !== '/test-login') {
      // User logged in but on auth pages (except test-login), redirect to role-specific dashboard
      const roleRoutes: Record<string, string> = {
        'chro': '/',
        'hr_partner': '/employees',
        'talent_ops': '/workforce-insights',
        'engagement_manager': '/engagement-analytics'
      };
      router.push(roleRoutes[user.role] || '/');
    }
  }, [user, isLoading, router.pathname, mounted]);

  // Loading state
  if (!mounted || (isLoading && !authPages.includes(router.pathname))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isAuthPage = authPages.includes(router.pathname);

  // Render auth pages without layout
  if (isAuthPage) {
    return <Component {...pageProps} />;
  }

  // Render dashboard pages with layout
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
}
