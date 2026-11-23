import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AdminRoleForm from '@admin/components/system/AdminRoleForm';
import ui from '@admin/components/ui.module.css';
import { adminGet, idParam } from '@admin/lib/api';
import { can, getAdminSession } from '@admin/lib/auth';
import type { AdminRole, PermissionInfo } from '@admin/lib/types';

export const metadata: Metadata = { title: 'ویرایش نقش' };
export const dynamic = 'force-dynamic';

export default async function EditAdminRolePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!can(session, 'system.roles')) return <Forbidden />;
  const id = idParam((await params).id);
  const [{ role }, { permissions }] = await Promise.all([
    adminGet<{ role: AdminRole }>(`/roles/${id}`),
    adminGet<{ permissions: PermissionInfo[] }>('/permissions'),
  ]);

  return (
    <>
      <div className={ui.pageHead}>
        <h1>ویرایش نقش: {role.name}</h1>
      </div>
      <AdminRoleForm permissions={permissions} role={role} />
    </>
  );
}
