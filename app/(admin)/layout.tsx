// Root layout of the ADMIN module. Independent of app/(front): its own <html>,
// its own global CSS / theme, and (later) its own providers and auth.
import type { Metadata } from 'next';
import { vazirmatn } from '@admin/fonts/vazirmatn';
import '@admin/styles/global.css';

export const metadata: Metadata = {
  title: { template: '%s | پنل مدیریت', default: 'پنل مدیریت' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body>{children}</body>
    </html>
  );
}
