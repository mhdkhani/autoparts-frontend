import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AdminUserForm from '@admin/components/system/AdminUserForm';
import { PageHeader } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage, can } from '@admin/lib/auth';
import type { AdminRole } from '@admin/lib/types';

export const metadata: Metadata = { title: 'افزودن کاربر' };

export default async function NewAdminUserPage() {
  const page = await adminPage('/admin/system/users');
  if (!page) return <Forbidden />;
  const { roles } = await adminGet<{ roles: AdminRole[] }>('/roles');

  return (
    <>
      <PageHeader title="افزودن کاربر جدید" crumbs={page.subCrumbs} />
      <AdminUserForm roles={roles} canManageRoles={can(page.session, 'system.roles')} />
    </>
  );
}
