import { useMemo } from 'react';
import { useAuth, type UserRole } from '@/context/AuthContext';

export const ALL_ROLES: UserRole[] = ['chro', 'hrbp', 'talent_ops', 'recruiter'];

export const AUTH_PAGES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/role-selection',
  '/auth/forgot-password',
  '/test-login',
  '/',
] as const;

export const ROLE_ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/dashboard': ['chro'],
  '/departments': ['chro'],
  '/department/[id]': ['chro'],
  '/employees': ['chro', 'hrbp'],
  '/employee/[id]': ['chro', 'hrbp', 'recruiter'],
  '/candidates': ['chro', 'recruiter'],
  '/workforce-insights': ['chro', 'talent_ops'],
  '/engagement-analytics': ['chro', 'hrbp'],
  '/meeting-intelligence': ['chro', 'hrbp'],
  '/documents': ['chro', 'hrbp', 'talent_ops'],
  '/ai-insights': ['chro', 'hrbp'],
  '/unauthorized': ALL_ROLES,
};

export const CHAT_BLOCKED_ROLES: UserRole[] = ['talent_ops', 'recruiter'];

export function canRoleAccessRoute(role: UserRole | null, pathname: string): boolean {
  if (AUTH_PAGES.includes(pathname as (typeof AUTH_PAGES)[number])) return true;
  if (!role) return false;

  const allowedRoles = ROLE_ROUTE_ACCESS[pathname];
  if (!allowedRoles) return true;
  return allowedRoles.includes(role);
}

export function isRoleBlockedFromChat(role: UserRole | null): boolean {
  if (!role) return false;
  return CHAT_BLOCKED_ROLES.includes(role);
}

export function isEmployeeVisibleToRole(
  role: UserRole | null,
  employeeId: string | number,
  assignedEmployeeIds: string[]
): boolean {
  if (!role) return false;
  if (role === 'chro' || role === 'recruiter') return true;
  if (role === 'hrbp') {
    return assignedEmployeeIds.includes(String(employeeId));
  }
  return false;
}

export function useRoleGuard() {
  const { user } = useAuth();

  const role = user?.role ?? null;
  const assignedEmployeeIds = user?.assignedEmployeeIds ?? [];

  return useMemo(
    () => ({
      user,
      role,
      assignedEmployeeIds,
      canAccessRoute: (pathname: string) => canRoleAccessRoute(role, pathname),
      canAccessEmployee: (employeeId: string | number) =>
        isEmployeeVisibleToRole(role, employeeId, assignedEmployeeIds),
      isChatBlocked: isRoleBlockedFromChat(role),
    }),
    [user, role, assignedEmployeeIds]
  );
}
