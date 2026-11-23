import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AdminUserForm from '@admin/components/system/AdminUserForm';
import UserStatusBadge from '@admin/components/system/UserStatusBadge';
import ui from '@admin/components/ui.module.css';
import { adminGet, idParam } from '@admin/lib/api';
import { can, getAdminSession } from '@admin/lib/auth';
import { faDate } from '@admin/lib/format';
import type { AdminRole, AdminUser } from '@admin/lib/types';

export const metadata: Metadata = { title: 'ویرایش کاربر' };
export const dynamic = 'force-dynamic';

export default async function EditAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!can(session, 'system.users')) return <Forbidden />;
  const id = idParam((await params).id);
  const [{ user }, { roles }] = await Promise.all([
    adminGet<{ user: AdminUser }>(`/users/${id}`),
    adminGet<{ roles: AdminRole[] }>('/roles'),
  ]);

  return (
    <>
      <div className={ui.pageHead}>
        <h1>
          ویرایش کاربر: {user.fullName} <UserStatusBadge user={user} />
        </h1>
        <span className={ui.muted}>
          ساخته‌شده در {faDate(user.createdAt)} · آخرین ورود {faDate(user.lastLoginAt)}
        </span>
      </div>
      <AdminUserForm
        roles={roles}
        canManageRoles={can(session, 'system.roles')}
        user={user}
        isSelf={user.id === session!.user.id}
      />
    </>
  );
}
