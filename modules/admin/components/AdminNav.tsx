'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV, NAV_TOGGLE_ID, hasAccess, isNavGroup, type Access, type NavEntry } from '@admin/lib/nav';
import { cx, Icon } from './ui';
import styles from './AdminShell.module.css';

// Sidebar. The menu and each item's acl live in lib/nav.ts; items this admin may not open are hidden
// (the page itself and the backend refuse them anyway).

function isActive(href: string, pathname: string) {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/');
}

export default function AdminNav({ access }: { access: Access }) {
  const pathname = usePathname();

  // what this admin may see (empty sections / groups disappear)
  const entries = (NAV as readonly NavEntry[]).flatMap<NavEntry>((e) => {
    if (!isNavGroup(e)) return hasAccess(e.acl, access) ? [e] : [];
    const sections = e.sections
      .map((s) => ({ ...s, items: s.items.filter((i) => hasAccess(i.acl, access)) }))
      .filter((s) => s.items.length > 0);
    return sections.length ? [{ ...e, sections }] : [];
  });

  const groupHasActive = (key: string) =>
    entries.some(
      (e) => isNavGroup(e) && e.key === key && e.sections.some((s) => s.items.some((i) => isActive(i.href, pathname))),
    );

  // a group starts open when the current page is inside it
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(entries.filter(isNavGroup).map((g) => [g.key, groupHasActive(g.key)])),
  );

  useEffect(() => {
    // small screens: close the slide-in sidebar after navigating, and open the new page's group
    const toggle = document.getElementById(NAV_TOGGLE_ID) as HTMLInputElement | null;
    if (toggle) toggle.checked = false;
    const active = entries.find((e) => isNavGroup(e) && groupHasActive(e.key));
    if (active && isNavGroup(active)) setOpen((o) => (o[active.key] ? o : { ...o, [active.key]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav className={styles.nav}>
      {entries.map((e) => {
        if (!isNavGroup(e)) {
          return (
            <Link key={e.href} href={e.href} className={cx(styles.link, isActive(e.href, pathname) && styles.active)}>
              <Icon name={e.icon} />
              <span className={styles.linkLabel}>{e.label}</span>
            </Link>
          );
        }
        const expanded = open[e.key] ?? false;
        return (
          <div key={e.key}>
            <button
              type="button"
              className={cx(styles.link, styles.groupToggle, groupHasActive(e.key) && styles.groupActive)}
              aria-expanded={expanded}
              onClick={() => setOpen((o) => ({ ...o, [e.key]: !expanded }))}
            >
              <Icon name={e.icon} />
              <span className={styles.linkLabel}>{e.label}</span>
              <span className={cx(styles.chevron, expanded && styles.chevronOpen)} aria-hidden>
                ‹
              </span>
            </button>
            {expanded && (
              <div className={styles.groupBody}>
                {e.sections.map((s, n) => (
                  <div key={s.title ?? n}>
                    {s.title && <div className={styles.sectionTitle}>{s.title}</div>}
                    {s.items.map((i) => (
                      <Link
                        key={i.href}
                        href={i.href}
                        className={cx(styles.subLink, isActive(i.href, pathname) && styles.active)}
                      >
                        <span className={styles.linkLabel}>{i.label}</span>
                        {i.soon && <span className={styles.soon}>به‌زودی</span>}
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
