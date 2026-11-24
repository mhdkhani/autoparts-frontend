// Browser-side calls of the panel. They go to the Next.js proxy /admin/api/* (same origin), which adds
// `Authorization: Bearer` from the httpOnly cookie and calls the API — JavaScript never sees the token,
// and the API never receives a cookie (see app/(admin)/admin/api/[...path]/route.ts).

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
