// Root layout of the FRONT module (the public store).
// The admin module has its own root layout in app/(admin): navigating between
// the two is a full page load, so their CSS / providers never mix.
import type { Metadata } from 'next';
import '@front/styles/global.css';

export const metadata: Metadata = { title: 'Autoparts' };

export default function FrontRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
