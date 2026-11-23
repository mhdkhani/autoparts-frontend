import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LoginForm from '@admin/components/LoginForm';
import { getAdminSession, safeAdminPath } from '@admin/lib/auth';

export const metadata: Metadata = { title: 'ورود' };

// Reads the cookie and env per request.
export const dynamic = 'force-dynamic';

// Outside the (panel) group → rendered without the sidebar shell.
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeAdminPath((await searchParams).next);
  // Already signed in (valid token, not just a cookie) → straight to the panel.
  if (await getAdminSession()) redirect(next);
  return <LoginForm next={next} />;
}
