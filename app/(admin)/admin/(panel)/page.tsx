import type { Metadata } from 'next';
import SystemStatus from '@admin/components/SystemStatus';

export const metadata: Metadata = { title: 'داشبورد' };

// Rendered per request: the backend isn't reachable during `next build`.
export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  return (
    <>
      <h1>داشبورد</h1>
      <SystemStatus />
    </>
  );
}
