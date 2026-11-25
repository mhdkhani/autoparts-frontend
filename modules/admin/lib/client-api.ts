// Browser-side calls of the panel. They go to the Next.js proxy /admin/api/* (same origin), which adds
// `Authorization: Bearer` from the httpOnly cookie and calls the API — JavaScript never sees the token,
// and the API never receives a cookie (see app/(admin)/admin/api/[...path]/route.ts).

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useConfirm, useToast, type ConfirmOptions } from '@admin/components/ui';

/** Base path of the panel's API proxy. */
export const ADMIN_API = '/admin/api';

export type SendResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

/**
 * POST / PUT / PATCH / DELETE `/admin/api${path}` (= `/api/admin${path}` of the backend).
 * A FormData body is sent as multipart (file upload), anything else as JSON; no other headers.
 * Errors come back as one Persian message (the backend's validation messages joined).
 * A 401 means the session ended → login page; the login form itself passes { redirectOn401: false }
 * (there 401 = wrong username / password, and the backend's message is shown).
 */
export async function adminSend<T = unknown>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  { redirectOn401 = true }: { redirectOn401?: boolean } = {},
): Promise<SendResult<T>> {
  const multipart = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API}${path}`, {
      method,
      // the httpOnly ap_admin cookie (Path=/admin) must reach the proxy
      credentials: 'same-origin',
      headers: body === undefined || multipart ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, error: 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.' };
  }

  if (res.status === 401 && redirectOn401) {
    window.location.assign('/admin/login');
    return { ok: false, status: 401, error: 'لطفاً دوباره وارد شوید.' };
  }
  const json = (await res.json().catch(() => null)) as { message?: unknown } | null;
  if (res.ok) return { ok: true, data: json as T };
  if (res.status === 413) return { ok: false, status: 413, error: 'حجم فایل بیشتر از حد مجاز است.' };

  const m = json?.message;
  const error = Array.isArray(m) ? m.join('، ') : typeof m === 'string' ? m : 'خطایی رخ داد. دوباره تلاش کنید.';
  return { ok: false, status: res.status, error };
}

/** Uploads one image (multipart `file`) to an admin upload endpoint, e.g. '/config/upload'; data = { url }. */
export function adminUpload(path: string, file: File): Promise<SendResult<{ url: string }>> {
  const form = new FormData();
  form.append('file', file);
  return adminSend('POST', path, form);
}

/**
 * Save / delete flow of a panel form: busy state, the server's error, a success toast, then back to the list.
 *   const form = useAdminForm('/admin/system/roles');
 *   form.send('PUT', `/roles/${id}`, body, 'تغییرات نقش ذخیره شد.');
 *   form.send('DELETE', `/roles/${id}`, undefined, 'نقش حذف شد.', { title: 'حذف نقش', message: '…' });  // asks first
 * Client components only (uses React hooks).
 */
export function useAdminForm(listHref: string) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<'' | 'save' | 'delete'>('');
  const [error, setError] = useState('');

  async function send(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body: unknown,
    success: string,
    ask?: ConfirmOptions,
  ): Promise<void> {
    if (ask && !(await confirm({ danger: true, ...ask }))) return;
    setError('');
    setBusy(method === 'DELETE' ? 'delete' : 'save');
    const res = await adminSend(method, path, body);
    if (!res.ok) {
      setError(res.error);
      setBusy('');
      return;
    }
    toast.success(success);
    router.push(listHref);
    router.refresh();
  }

  return { busy, error, setError, send };
}
