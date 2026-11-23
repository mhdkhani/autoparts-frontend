// Server-side only: read admin API endpoints with `Authorization: Bearer <this request's admin token>`.
import { notFound, redirect } from 'next/navigation';
import { backendFetch } from '@shared/backend';
import { adminToken } from './auth';

/** GET /api/admin<path>. 401 → login page, 404 → the panel's 404. */
export async function adminGet<T>(path: string): Promise<T> {
  const res = await backendFetch(`/admin${path}`, { token: await adminToken() });
  if (res.status === 401) redirect('/admin/login');
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`GET /api/admin${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

/** "12" → 12; anything else → 404. For [id] route params. */
export function idParam(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  return id;
}
