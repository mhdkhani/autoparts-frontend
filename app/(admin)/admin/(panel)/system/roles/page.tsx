import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import { Button, Card, DataTable, PageHeader, StatusBadge, type Column } from '@admin/components/ui';
import css from '@admin/components/ui/ui.module.css';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import { navLabel } from '@admin/lib/nav';
import type { AdminRole, PermissionInfo } from '@admin/lib/types';

const HREF = '/admin/system/roles';
export const metadata: Metadata = { title: navLabel(HREF) };

export default async function AdminRolesPage() {
  const page = await adminPage(HREF);
  if (!page) return <Forbidden />;
  const [{ roles }, { permissions }] = await Promise.all([
    adminGet<{ roles: AdminRole[] }>('/roles'),
    adminGet<{ permissions: PermissionInfo[] }>('/permissions'),
  ]);
  const label = (key: string) => permissions.find((p) => p.key === key)?.label ?? key;
  const myRole = page.session.user.role.id;

  const columns: Column<AdminRole>[] = [
    { key: 'id', title: 'شناسه', width: 90 },
    {
      key: 'name',
      title: 'نام نقش',
      link: (r) => `${HREF}/${r.id}`,
      render: (r) => (r.id === myRole ? `${r.name} (نقش شما)` : r.name),
    },
    {
      key: 'permissions',
      title: 'دسترسی‌ها',
      wrap: true,
      render: (r) =>
        r.allPermissions ? (
          <StatusBadge tone="info">همه‌ی دسترسی‌ها</StatusBadge>
        ) : r.permissions.length ? (
          r.permissions.map(label).join('، ')
        ) : (
          <span className={css.muted}>فقط داشبورد</span>
        ),
    },
    { key: 'userCount', title: 'تعداد کاربران', render: (r) => r.userCount ?? 0 },
  ];

  return (
    <>
      <PageHeader
        title={page.title}
        crumbs={page.crumbs}
        actions={
          <Button href={`${HREF}/new`} variant="primary">
            + افزودن نقش جدید
          </Button>
        }
      />
      <Card flush>
        <DataTable columns={columns} rows={roles} rowKey={(r) => r.id} empty="نقشی تعریف نشده است." />
      </Card>
    </>
  );
}
