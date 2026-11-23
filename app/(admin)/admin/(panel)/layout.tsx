import { redirect } from 'next/navigation';
import AdminShell from '@admin/components/AdminShell';
import { getAdminSession } from '@admin/lib/auth';

// Panel pages (/admin/*) render inside the admin theme, only for a signed-in admin.
// middleware.ts already sent cookie-less requests to /admin/login; here the token itself is
// verified with the backend (expired, revoked or deactivated → back to login).
// /admin/login lives outside this group, so it has no sidebar and no check.
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return (
    <AdminShell session={session}>
      {children}
    </AdminShell>
  );
}
