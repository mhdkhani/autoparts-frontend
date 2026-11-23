import type { Metadata } from 'next';
import Link from 'next/link';
import Forbidden from '@admin/components/Forbidden';
import UserStatusBadge from '@admin/components/system/UserStatusBadge';
import ui from '@admin/components/ui.module.css';
import { adminGet } from '@admin/lib/api';
import { can, getAdminSession } from '@admin/lib/auth';
import { faDate } from '@admin/lib/format';
import type { AdminUser } from '@admin/lib/types';

export const metadata: Metadata = { title: 'همه‌ی کاربران' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!can(session, 'system.users')) return <Forbidden />;
  const { users } = await adminGet<{ users: AdminUser[] }>('/users');

  return (
    <>
      <div className={ui.pageHead}>
        <h1>همه‌ی کاربران</h1>
        <Link href="/admin/system/users/new" className={`${ui.btn} ${ui.primary}`}>
          + افزودن کاربر جدید
        </Link>
      </div>

      <div className={ui.card}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th>شناسه</th>
              <th>نام</th>
              <th>نام کاربری</th>
              <th>ایمیل</th>
              <th>نقش</th>
              <th>وضعیت</th>
              <th>آخرین ورود</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  <Link href={`/admin/system/users/${u.id}`} className={ui.rowLink}>
                    {u.fullName}
                  </Link>
                  {u.id === session!.user.id && <span className={ui.muted}> (شما)</span>}
                </td>
                <td dir="ltr">{u.username}</td>
                <td dir="ltr">{u.email}</td>
                <td>{u.role.name}</td>
                <td>
                  <UserStatusBadge user={u} />
                </td>
                <td>{faDate(u.lastLoginAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className={ui.empty}>کاربری وجود ندارد.</div>}
      </div>
    </>
  );
}
