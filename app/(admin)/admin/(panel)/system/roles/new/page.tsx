import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AdminRoleForm from '@admin/components/system/AdminRoleForm';
import { PageHeader } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { PermissionInfo } from '@admin/lib/types';

export const metadata: Metadata = { title: 'افزودن نقش' };

export default async function NewAdminRolePage() {
  const page = await adminPage('/admin/system/roles');
  if (!page) return <Forbidden />;
  const { permissions } = await adminGet<{ permissions: PermissionInfo[] }>('/permissions');

  return (
    <>
      <PageHeader title="افزودن نقش جدید" crumbs={page.subCrumbs} />
      <AdminRoleForm permissions={permissions} />
    </>
  );
}
