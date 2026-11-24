import { redirect } from 'next/navigation';
import AdminShell from '@admin/components/AdminShell';
import { getAdminSession } from '@admin/lib/auth';

// Every panel page is rendered per request (it reads the admin cookie; the backend isn't reachable during
// `next build`). Set once here for the whole (panel) group — pages don't repeat it.
export const dynamic = 'force-dynamic';

// Panel pages (/admin/*) render inside the admin theme, only for a signed-in admin.
// middleware.ts already sent cookie-less requests to /admin/login; here the token itself is
// verified with the backend (expired, revoked or deactivated → back to login).
// Who may open each page is decided by the page itself: adminPage(href) + the menu's acl (lib/nav.ts).
// /admin/login lives outside this group, so it has no sidebar and no check.
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return <AdminShell session={session}>{children}</AdminShell>;
}
