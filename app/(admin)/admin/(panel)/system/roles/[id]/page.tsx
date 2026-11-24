import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AdminRoleForm from '@admin/components/system/AdminRoleForm';
import { PageHeader } from '@admin/components/ui';
import { adminGet, idParam } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { AdminRole, PermissionInfo } from '@admin/lib/types';

export const metadata: Metadata = { title: 'ویرایش نقش' };

export default async function EditAdminRolePage({ params }: { params: Promise<{ id: string }> }) {
  const page = await adminPage('/admin/system/roles');
  if (!page) return <Forbidden />;
  const id = idParam((await params).id);
  const [{ role }, { permissions }] = await Promise.all([
    adminGet<{ role: AdminRole }>(`/roles/${id}`),
    adminGet<{ permissions: PermissionInfo[] }>('/permissions'),
  ]);

  return (
    <>
      <PageHeader title={`ویرایش نقش: ${role.name}`} crumbs={page.subCrumbs} />
      <AdminRoleForm permissions={permissions} role={role} />
    </>
  );
}
