import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AdminRoleForm from '@admin/components/system/AdminRoleForm';
import ui from '@admin/components/ui.module.css';
import { adminGet } from '@admin/lib/api';
import { can, getAdminSession } from '@admin/lib/auth';
import type { PermissionInfo } from '@admin/lib/types';

export const metadata: Metadata = { title: 'افزودن نقش' };
export const dynamic = 'force-dynamic';

export default async function NewAdminRolePage() {
  const session = await getAdminSession();
  if (!can(session, 'system.roles')) return <Forbidden />;
  const { permissions } = await adminGet<{ permissions: PermissionInfo[] }>('/permissions');

  return (
    <>
      <div className={ui.pageHead}>
        <h1>افزودن نقش جدید</h1>
      </div>
      <AdminRoleForm permissions={permissions} />
    </>
  );
}
