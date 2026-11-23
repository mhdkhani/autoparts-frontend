import { NextResponse, type NextRequest } from 'next/server';

// Same name as ADMIN_COOKIE in modules/admin/lib/auth.ts (kept self-contained: middleware runs on the edge runtime).
const ADMIN_COOKIE = 'ap_admin';

/**
 * Fast gate for the panel pages: no ap_admin cookie → /admin/login?next=<where you were going>.
 * It only checks that the cookie exists; the panel layout verifies the token with the backend
 * (getAdminSession), and every admin API endpoint checks it again.
 * /admin/api/* (the proxy) is not redirected — it answers 401 JSON itself.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) return NextResponse.next();
  if (pathname === '/admin/api' || pathname.startsWith('/admin/api/')) return NextResponse.next();
  if (req.cookies.has(ADMIN_COOKIE)) return NextResponse.next();

  // req.url carries the browser's host:port (nginx forwards Host as $http_host).
  const login = new URL('/admin/login', req.url);
  login.searchParams.set('next', pathname + search);
  return NextResponse.redirect(login);
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
