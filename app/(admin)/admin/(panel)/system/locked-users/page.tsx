import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import UnlockButton from '@admin/components/system/UnlockButton';
import { Card, DataTable, PageHeader, type Column } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import { faDate } from '@admin/lib/format';
import { navLabel } from '@admin/lib/nav';
import type { AdminUser } from '@admin/lib/types';

const HREF = '/admin/system/locked-users';
export const metadata: Metadata = { title: navLabel(HREF) };

const columns: Column<AdminUser>[] = [
  { key: 'id', title: 'شناسه', width: 90 },
  { key: 'fullName', title: 'نام', link: (u) => `/admin/system/users/${u.id}` },
  { key: 'username', title: 'نام کاربری', ltr: true },
  { key: 'email', title: 'ایمیل', ltr: true },
  { key: 'lockedUntil', title: 'قفل تا', render: (u) => faDate(u.lockedUntil) },
  { key: 'unlock', title: '', render: (u) => <UnlockButton userId={u.id} /> },
];

export default async function LockedAdminUsersPage() {
  const page = await adminPage(HREF);
  if (!page) return <Forbidden />;
  const { users } = await adminGet<{ users: AdminUser[] }>('/users/locked');

  return (
    <>
      <PageHeader
        title={page.title}
        crumbs={page.crumbs}
        subtitle="حساب‌هایی که به‌دلیل تلاش‌های ناموفق ورود موقتاً قفل شده‌اند."
      />
      <Card flush>
        <DataTable columns={columns} rows={users} rowKey={(u) => u.id} empty="هیچ کاربری قفل نیست." />
      </Card>
    </>
  );
}
