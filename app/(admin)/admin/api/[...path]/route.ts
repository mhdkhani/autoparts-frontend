// /admin/api/* — the panel's only way to the admin API (a small BFF proxy).
//
//   browser ──(httpOnly ap_admin cookie, Path=/admin)──▶ here ──(Authorization: Bearer only)──▶ NestJS /api/admin/*
//
// • The token never reaches JavaScript, and the API never receives a cookie or browser headers.
// • A response with { token, expiresAt } (login, own password change) → stored in the cookie, removed from the body.
// • logout / logout-all / any 401 → cookie deleted.
import { NextResponse, type NextRequest } from 'next/server';
import { backendFetch } from '@shared/backend';
import { ADMIN_COOKIE, ADMIN_COOKIE_PATH } from '@admin/lib/auth';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  const path = (await params).path.map(encodeURIComponent).join('/');
  const method = req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  const hasBody = method !== 'GET' && method !== 'DELETE';
  const isLogin = path === 'auth/login';

  const res = await backendFetch(`/admin/${path}${req.nextUrl.search}`, {
    method,
    token: isLogin ? undefined : req.cookies.get(ADMIN_COOKIE)?.value,
    body: hasBody ? await req.arrayBuffer() : undefined,
    contentType: hasBody ? (req.headers.get('content-type') ?? undefined) : undefined,
    // the API rate-limits login attempts per client IP (nginx put the client's address here)
    forwardedFor: isLogin ? (req.headers.get('x-forwarded-for') ?? undefined) : undefined,
  });

  const text = res.status === 204 ? '' : await res.text();
  let json: Record<string, unknown> | undefined;
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
  } catch {
    json = undefined;
  }

  let issued: { token: string; expiresAt: string } | undefined;
  if (res.ok && json && typeof json.token === 'string' && typeof json.expiresAt === 'string') {
    issued = { token: json.token, expiresAt: json.expiresAt };
    delete json.token;
    delete json.expiresAt;
  }

  const out =
    res.status === 204
      ? new NextResponse(null, { status: 204 })
      : new NextResponse(json ? JSON.stringify(json) : text, {
          status: res.status,
          headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
        });

  if (issued) {
    out.cookies.set(ADMIN_COOKIE, issued.token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'strict',
      path: ADMIN_COOKIE_PATH,
      expires: new Date(issued.expiresAt),
    });
  }
  const loggedOut = res.ok && (path === 'auth/logout' || path === 'auth/logout-all');
  if (loggedOut || (res.status === 401 && !isLogin)) {
    out.cookies.set(ADMIN_COOKIE, '', { path: ADMIN_COOKIE_PATH, maxAge: 0 });
  }
  if (isLogin || loggedOut) {
    // remove the old cookie of the earlier setup (Path=/, set by the API itself) if a browser still has it.
    // A separate header: cookies.set() keeps one cookie per name and would replace the one set above.
    out.headers.append('Set-Cookie', `${ADMIN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`);
  }
  return out;
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
