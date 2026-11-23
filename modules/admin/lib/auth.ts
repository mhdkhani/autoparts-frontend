// Server-side only (route handlers, server components / layouts): the admin's token and session.
import { cache } from 'react';
import { cookies } from 'next/headers';
import { backendFetch } from '@shared/backend';
import type { AdminUser, Permission } from './types';

/**
 * httpOnly cookie holding the admin JWT, set by the /admin/api proxy at login.
 * Path=/admin: the browser sends it only to panel pages and the proxy — never to the API (/api/*).
 * The API itself only ever receives the token as `Authorization: Bearer` (from the server side).
 * Also used by /middleware.ts.
 */
export const ADMIN_COOKIE = 'ap_admin';
export const ADMIN_COOKIE_PATH = '/admin';

export type AdminSession = { user: AdminUser; permissions: Permission[] };

/** This request's admin token (from the httpOnly cookie), or undefined. */
export async function adminToken(): Promise<string | undefined> {
  return (await cookies()).get(ADMIN_COOKIE)?.value;
}

/**
 * Asks the backend (GET /api/admin/auth/me with `Authorization: Bearer`) whether this request's token is
 * valid. null = not signed in / expired / logged out / deactivated. Cached per request (layout + page share it).
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const token = await adminToken();
  if (!token) return null;
  const res = await backendFetch('/admin/auth/me', { token });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /api/admin/auth/me failed: ${res.status}`);
  return (await res.json()) as AdminSession;
});

export function can(session: AdminSession | null, permission: Permission): boolean {
  return Boolean(session?.permissions.includes(permission));
}

/**
 * Where to go after login. Only panel paths are allowed (no open redirect to other sites).
 */
export function safeAdminPath(value: unknown): string {
  if (
    typeof value === 'string' &&
    /^\/admin(\/|\?|$)/.test(value) &&
    !value.startsWith('/admin/login') &&
    !value.startsWith('/admin/api') &&
    !value.includes('//') &&
    !value.includes('\\')
  ) {
    return value;
  }
  return '/admin';
}
