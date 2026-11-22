import type { Metadata } from 'next';
import LoginForm from '@admin/components/LoginForm';

export const metadata: Metadata = { title: 'ورود' };

// Outside the (panel) group → rendered without the sidebar shell.
export default function AdminLoginPage() {
  return <LoginForm />;
}
