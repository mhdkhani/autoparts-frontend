'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminShell.module.css';

// Sidebar menu. Add an entry here for each admin section as it is built.
const ITEMS = [{ href: '/admin', label: 'داشبورد' }];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav>
      {ITEMS.map((item) => {
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? `${styles.link} ${styles.active}` : styles.link}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
