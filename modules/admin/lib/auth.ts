// Server-side only (route handlers, server components / layouts): the admin's token and session.
import { cache } from 'react';
import { cookies } from 'next/headers';
import { backendFetch } from '@shared/backend';
import { hasAccess, navCrumbs, navItem, type NavHref, type Permission } from './nav';
import type { AdminUser } from './types';

/**
 * httpOnly cookie holding the admin JWT, set by the /admin/api proxy at login.
 * Path=/admin: the browser sends it only to panel pages and the proxy — never to the API (/api/*).
 * The API itself only ever receives the token as `Authorization: Bearer` (from the server side).
 * Also used by /middleware.ts.
 */
export const ADMIN_COOKIE = 'ap_admin';
export const ADMIN_COOKIE_PATH = '/admin';

/** GET /api/admin/auth/me — allPermissions / permissions are the token's (exactly what the API allows). */
export type AdminSession = { user: AdminUser; allPermissions: boolean; permissions: string[] };

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

/** For checks inside a page (e.g. show a link only if the admin may manage roles). */
export function can(session: AdminSession | null, permission: Permission): boolean {
  return hasAccess(permission, session);
}

/**
 * Start of every panel page: who may open it is the `acl` of its menu item in lib/nav.ts (sub-pages such as
 * new / [id] pass their list's href). null → render <Forbidden />. Also gives the breadcrumb and title.
 *   const page = await adminPage('/admin/system/users');
 *   if (!page) return <Forbidden />;
 */
export async function adminPage(href: NavHref) {
  const hit = navItem(href)!;
  const session = await getAdminSession();
  if (!session || !hasAccess(hit.item.acl, session)) return null;
  return { session, title: hit.item.label, crumbs: navCrumbs(hit), subCrumbs: navCrumbs(hit, true) };
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
