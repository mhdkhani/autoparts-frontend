import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AdminUserForm from '@admin/components/system/AdminUserForm';
import UserStatusBadge from '@admin/components/system/UserStatusBadge';
import { PageHeader } from '@admin/components/ui';
import { adminGet, idParam } from '@admin/lib/api';
import { adminPage, can } from '@admin/lib/auth';
import { faDate } from '@admin/lib/format';
import type { AdminRole, AdminUser } from '@admin/lib/types';

export const metadata: Metadata = { title: 'ویرایش کاربر' };

export default async function EditAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const page = await adminPage('/admin/system/users');
  if (!page) return <Forbidden />;
  const id = idParam((await params).id);
  const [{ user }, { roles }] = await Promise.all([
    adminGet<{ user: AdminUser }>(`/users/${id}`),
    adminGet<{ roles: AdminRole[] }>('/roles'),
  ]);

  return (
    <>
      <PageHeader
        title={
          <>
            ویرایش کاربر: {user.fullName} <UserStatusBadge user={user} />
          </>
        }
        crumbs={page.subCrumbs}
        subtitle={`ساخته‌شده در ${faDate(user.createdAt)} · آخرین ورود ${faDate(user.lastLoginAt)}`}
      />
      <AdminUserForm
        roles={roles}
        canManageRoles={can(page.session, 'system.roles')}
        user={user}
        isSelf={user.id === page.session.user.id}
      />
    </>
  );
}
