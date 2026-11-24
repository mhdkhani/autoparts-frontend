import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import SystemStatus from '@admin/components/SystemStatus';
import { PageHeader } from '@admin/components/ui';
import { adminPage } from '@admin/lib/auth';
import { navLabel } from '@admin/lib/nav';

export const metadata: Metadata = { title: navLabel('/admin') };

export default async function AdminDashboard() {
  const page = await adminPage('/admin');
  if (!page) return <Forbidden />;
  return (
    <>
      <PageHeader title={page.title} />
      <SystemStatus />
    </>
  );
}
