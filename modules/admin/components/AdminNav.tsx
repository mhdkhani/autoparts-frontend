'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Permission } from '@admin/lib/types';
import styles from './AdminShell.module.css';

type NavLink = { href: string; label: string; permission?: Permission };
type NavGroup = { key: string; label: string; sections: { title: string; items: NavLink[] }[] };
type NavEntry = NavLink | NavGroup;

// Sidebar menu. Add an entry here for each admin section as it is built.
// Items whose permission the admin's role lacks are hidden (the backend refuses them anyway).
const NAV: NavEntry[] = [
  { href: '/admin', label: 'داشبورد' },
  {
    key: 'site',
    label: 'سایت',
    sections: [
      {
        title: 'دسترسی‌ها',
        items: [
          { href: '/admin/system/users', label: 'همه‌ی کاربران', permission: 'system.users' },
          { href: '/admin/system/locked-users', label: 'کاربران قفل‌شده', permission: 'system.users' },
          { href: '/admin/system/roles', label: 'نقش‌های کاربری', permission: 'system.roles' },
        ],
      },
      {
        title: 'تنظیمات',
        items: [{ href: '/admin/system/config', label: 'تنظیمات سایت', permission: 'system.config' }],
      },
    ],
  },
];

const isGroup = (e: NavEntry): e is NavGroup => 'sections' in e;

function isActive(href: string, pathname: string) {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/');
}

export default function AdminNav({ permissions }: { permissions: Permission[] }) {
  const pathname = usePathname();
  const allowed = (l: NavLink) => !l.permission || permissions.includes(l.permission);

  // groups the admin may see (empty sections / groups disappear)
  const entries = NAV.flatMap<NavEntry>((e) => {
    if (!isGroup(e)) return allowed(e) ? [e] : [];
    const sections = e.sections
      .map((s) => ({ ...s, items: s.items.filter(allowed) }))
      .filter((s) => s.items.length > 0);
    return sections.length ? [{ ...e, sections }] : [];
  });

  // a group starts open when the current page is inside it
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      entries
        .filter(isGroup)
        .map((g) => [g.key, g.sections.some((s) => s.items.some((i) => isActive(i.href, pathname)))]),
    ),
  );

  return (
    <nav>
      {entries.map((e) => {
        if (!isGroup(e)) {
          return (
            <Link key={e.href} href={e.href} className={cls(styles.link, isActive(e.href, pathname) && styles.active)}>
              {e.label}
            </Link>
          );
        }
        const expanded = open[e.key] ?? false;
        const containsActive = e.sections.some((s) => s.items.some((i) => isActive(i.href, pathname)));
        return (
          <div key={e.key}>
            <button
              type="button"
              className={cls(styles.link, styles.groupToggle, containsActive && styles.groupActive)}
              aria-expanded={expanded}
              onClick={() => setOpen((o) => ({ ...o, [e.key]: !expanded }))}
            >
              <span>{e.label}</span>
              <span className={cls(styles.chevron, expanded && styles.chevronOpen)} aria-hidden>
                ‹
              </span>
            </button>
            {expanded && (
              <div className={styles.groupBody}>
                {e.sections.map((s) => (
                  <div key={s.title}>
                    <div className={styles.sectionTitle}>{s.title}</div>
                    {s.items.map((i) => (
                      <Link
                        key={i.href}
                        href={i.href}
                        className={cls(styles.subLink, isActive(i.href, pathname) && styles.active)}
                      >
                        {i.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function cls(...names: (string | false | undefined)[]) {
  return names.filter(Boolean).join(' ');
}
