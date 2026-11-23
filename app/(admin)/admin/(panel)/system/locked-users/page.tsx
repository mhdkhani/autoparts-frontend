import type { Metadata } from 'next';
import Link from 'next/link';
import Forbidden from '@admin/components/Forbidden';
import UnlockButton from '@admin/components/system/UnlockButton';
import ui from '@admin/components/ui.module.css';
import { adminGet } from '@admin/lib/api';
import { can, getAdminSession } from '@admin/lib/auth';
import { faDate } from '@admin/lib/format';
import type { AdminUser } from '@admin/lib/types';

export const metadata: Metadata = { title: 'کاربران قفل‌شده' };
export const dynamic = 'force-dynamic';

export default async function LockedAdminUsersPage() {
  const session = await getAdminSession();
  if (!can(session, 'system.users')) return <Forbidden />;
  const { users } = await adminGet<{ users: AdminUser[] }>('/users/locked');

  return (
    <>
      <div className={ui.pageHead}>
        <h1>کاربران قفل‌شده</h1>
        <span className={ui.muted}>حساب‌هایی که به‌دلیل تلاش‌های ناموفق ورود موقتاً قفل شده‌اند.</span>
      </div>

      <div className={ui.card}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th>شناسه</th>
              <th>نام</th>
              <th>نام کاربری</th>
              <th>ایمیل</th>
              <th>قفل تا</th>
              <th />
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
                </td>
                <td dir="ltr">{u.username}</td>
                <td dir="ltr">{u.email}</td>
                <td>{faDate(u.lockedUntil)}</td>
                <td>
                  <UnlockButton userId={u.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className={ui.empty}>هیچ کاربری قفل نیست.</div>}
      </div>
    </>
  );
}
