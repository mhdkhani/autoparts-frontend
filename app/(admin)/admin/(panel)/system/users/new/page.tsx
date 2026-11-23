import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AdminUserForm from '@admin/components/system/AdminUserForm';
import ui from '@admin/components/ui.module.css';
import { adminGet } from '@admin/lib/api';
import { can, getAdminSession } from '@admin/lib/auth';
import type { AdminRole } from '@admin/lib/types';

export const metadata: Metadata = { title: 'افزودن کاربر' };
export const dynamic = 'force-dynamic';

export default async function NewAdminUserPage() {
  const session = await getAdminSession();
  if (!can(session, 'system.users')) return <Forbidden />;
  const { roles } = await adminGet<{ roles: AdminRole[] }>('/roles');

  return (
    <>
      <div className={ui.pageHead}>
        <h1>افزودن کاربر جدید</h1>
      </div>
      <AdminUserForm
        roles={roles}
        canManageRoles={can(session, 'system.roles')}
      />
    </>
  );
}
