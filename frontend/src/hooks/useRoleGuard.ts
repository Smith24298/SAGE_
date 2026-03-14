import { useMemo } from 'react';
import { useAuth, type UserRole } from '@/context/AuthContext';

export const ALL_ROLES: UserRole[] = [
  'chro',
  'hr_partner',
  'talent_ops',
  'engagement_manager',
];

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
  '/employees': ['chro', 'hr_partner'],
  '/employee/[id]': ['chro', 'hr_partner', 'talent_ops'],
  '/candidates': ['chro', 'talent_ops'],
  '/workforce-insights': ['chro', 'talent_ops'],
  '/events': ['engagement_manager'],
  '/engagement-analytics': ['chro', 'engagement_manager'],
  '/meeting-intelligence': ['chro', 'hr_partner', 'talent_ops', 'engagement_manager'],
  '/documents': ['chro', 'hr_partner', 'talent_ops', 'engagement_manager'],
  '/ai-insights': ['chro', 'hr_partner', 'talent_ops', 'engagement_manager'],
  '/unauthorized': ALL_ROLES,
};

export const CHAT_BLOCKED_ROLES: UserRole[] = [];

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
  if (role === 'chro' || role === 'hr_partner') return true;
  if (role === 'talent_ops') {
    if (assignedEmployeeIds.length === 0) {
      return true;
    }
    return assignedEmployeeIds.includes(String(employeeId));
  }
  return false;
}

export function useRoleGuard() {
  const { user } = useAuth();

  const role = user?.role ?? null;
  const assignedEmployeeIds =
    user && 'assignedEmployeeIds' in (user as unknown as Record<string, unknown>)
      ? (((user as unknown as { assignedEmployeeIds?: unknown }).assignedEmployeeIds as string[]) || [])
      : [];

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
