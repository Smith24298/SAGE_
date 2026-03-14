import type { AppProps } from "next/app";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import '@/styles/index.css';

import { Layout } from '@/app/components/Layout';
import { AuthProvider, useAuth, USER_ROLE_ROUTES } from '@/context/AuthContext';

// Auth pages that should NOT have the Layout wrapper
const authPages = ['/auth/signin', '/auth/signup', '/auth/role-selection', '/auth/forgot-password', '/test-login', '/'];

function AppContent({ Component, pageProps, router }: AppProps) {
  const routerPath = router.pathname;
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    const isAuthPage = authPages.includes(routerPath);

    // Redirect logic: not logged in -> signin; logged in but no role -> role-selection; has role on auth page -> dashboard
    if (!user && !isAuthPage) {
      router.push('/auth/signin');
    } else if (user?.role == null && !isAuthPage && routerPath !== '/auth/role-selection') {
      router.push('/auth/role-selection');
    } else if (user?.role != null && isAuthPage && routerPath !== '/test-login' && routerPath !== '/') {
      router.push(USER_ROLE_ROUTES[user.role] || '/dashboard');
    }
  }, [user, isLoading, routerPath, mounted]);

  // Loading state
  if (!mounted || (isLoading && !authPages.includes(routerPath))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isAuthPage = authPages.includes(routerPath);

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

import Head from 'next/head';

export default function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>SAGE - Strategic Advisor for Growth and Engagement</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%23e1634a%22/><text y=%22.9em%22 font-size=%2280%22 x=%225%22 fill=%22white%22 font-family=%22system-ui%22 font-weight=%22bold%22>S</text></svg>" />
      </Head>
      <AppContent Component={Component} pageProps={pageProps} router={router} />
    </AuthProvider>
  );
}
