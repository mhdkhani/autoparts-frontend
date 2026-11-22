import AdminShell from '@admin/components/AdminShell';

// Panel pages (/admin/*) render inside the admin theme. Pages that must not
// have the sidebar (e.g. a future /admin/login) go in their own route group.
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
