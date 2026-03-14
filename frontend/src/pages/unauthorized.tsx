import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth, USER_ROLE_ROUTES } from '@/context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const fallbackRoute = user?.role ? USER_ROLE_ROUTES[user.role] : '/auth/signin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-lg w-full p-8 rounded-2xl border border-border bg-card shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You do not have permission to view this page with your current role.
        </p>
        <Link
          href={fallbackRoute}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to your dashboard
        </Link>
      </div>
    </div>
  );
}
