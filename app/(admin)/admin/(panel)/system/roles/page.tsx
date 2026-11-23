import type { Metadata } from 'next';
import Link from 'next/link';
import Forbidden from '@admin/components/Forbidden';
import ui from '@admin/components/ui.module.css';
import { adminGet } from '@admin/lib/api';
import { can, getAdminSession } from '@admin/lib/auth';
import type { AdminRole, PermissionInfo } from '@admin/lib/types';

export const metadata: Metadata = { title: 'نقش‌های کاربری' };
export const dynamic = 'force-dynamic';

export default async function AdminRolesPage() {
  const session = await getAdminSession();
  if (!can(session, 'system.roles')) return <Forbidden />;
  const [{ roles }, { permissions }] = await Promise.all([
    adminGet<{ roles: AdminRole[] }>('/roles'),
    adminGet<{ permissions: PermissionInfo[] }>('/permissions'),
  ]);
  const label = (key: string) => permissions.find((p) => p.key === key)?.label ?? key;

  return (
    <>
      <div className={ui.pageHead}>
        <h1>نقش‌های کاربری</h1>
        <Link href="/admin/system/roles/new" className={`${ui.btn} ${ui.primary}`}>
          + افزودن نقش جدید
        </Link>
      </div>

      <div className={ui.card}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th>شناسه</th>
              <th>نام نقش</th>
              <th>دسترسی‌ها</th>
              <th>تعداد کاربران</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>
                  <Link href={`/admin/system/roles/${r.id}`} className={ui.rowLink}>
                    {r.name}
                  </Link>
                  {r.id === session!.user.role.id && <span className={ui.muted}> (نقش شما)</span>}
                </td>
                <td style={{ whiteSpace: 'normal' }}>
                  {r.allPermissions ? (
                    <span className={`${ui.badge} ${ui.info}`}>همه‌ی دسترسی‌ها</span>
                  ) : r.permissions.length ? (
                    r.permissions.map(label).join('، ')
                  ) : (
                    <span className={ui.muted}>فقط داشبورد</span>
                  )}
                </td>
                <td>{r.userCount ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {roles.length === 0 && <div className={ui.empty}>نقشی تعریف نشده است.</div>}
      </div>
    </>
  );
}
