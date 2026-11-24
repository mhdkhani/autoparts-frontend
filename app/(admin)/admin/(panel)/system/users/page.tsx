import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import UserStatusBadge from '@admin/components/system/UserStatusBadge';
import { Button, Card, DataTable, PageHeader, readTableState, sortAndPage, type Column, type SearchParams } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import { faDate } from '@admin/lib/format';
import { navLabel } from '@admin/lib/nav';
import type { AdminUser } from '@admin/lib/types';

const HREF = '/admin/system/users';
export const metadata: Metadata = { title: navLabel(HREF) };

const SORT = {
  id: (u: AdminUser) => u.id,
  fullName: (u: AdminUser) => u.fullName,
  username: (u: AdminUser) => u.username,
  role: (u: AdminUser) => u.role.name,
  lastLoginAt: (u: AdminUser) => u.lastLoginAt,
};

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const page = await adminPage(HREF);
  if (!page) return <Forbidden />;
  const params = await searchParams;
  const { users } = await adminGet<{ users: AdminUser[] }>('/users');
  const state = readTableState(params, { sortable: Object.keys(SORT), sort: 'id' });
  const { rows, total } = sortAndPage(users, state, SORT);
  const meId = page.session.user.id;

  const columns: Column<AdminUser>[] = [
    { key: 'id', title: 'شناسه', sortable: true, width: 90 },
    {
      key: 'fullName',
      title: 'نام',
      sortable: true,
      link: (u) => `${HREF}/${u.id}`,
      render: (u) => (u.id === meId ? `${u.fullName} (شما)` : u.fullName),
    },
    { key: 'username', title: 'نام کاربری', sortable: true, ltr: true },
    { key: 'email', title: 'ایمیل', ltr: true },
    { key: 'role', title: 'نقش', sortable: true, render: (u) => u.role.name },
    { key: 'status', title: 'وضعیت', render: (u) => <UserStatusBadge user={u} /> },
    { key: 'lastLoginAt', title: 'آخرین ورود', sortable: true, render: (u) => faDate(u.lastLoginAt) },
  ];

  return (
    <>
      <PageHeader
        title={page.title}
        crumbs={page.crumbs}
        actions={
          <Button href={`${HREF}/new`} variant="primary">
            + افزودن کاربر جدید
          </Button>
        }
      />
      <Card flush>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(u) => u.id}
          empty="کاربری وجود ندارد."
          state={state}
          total={total}
          params={params}
        />
      </Card>
    </>
  );
}
