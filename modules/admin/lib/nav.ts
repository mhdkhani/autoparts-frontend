// ⭐ The panel menu — the ONE place to change it (PROJECT-NOTES §8).
// Everything else reads from here: the sidebar (AdminNav), who may open each page (adminPage() in auth.ts),
// breadcrumbs, page titles, and the frontend's list of permission keys (Permission).
//
// Only sections that work are listed: a new section gets its item here when its page is built.
//
// Every item MUST declare its `acl`:
//   'superadmin'   only a role with «همه‌ی دسترسی‌ها» (مدیر کل)
//   '<key>'        roles that have this permission key (backend: admin-permissions.ts + @RequirePermission)
//   'any'          every signed-in admin — only the dashboard
import type { Crumb, IconName } from '@admin/components/ui';

type Acl = string;
export type NavLink = {
  readonly href: string;
  readonly label: string;
  readonly acl: Acl;
};
export type NavSection = { readonly title?: string; readonly items: readonly NavLink[] };
export type NavGroup = { readonly key: string; readonly label: string; readonly icon: IconName; readonly sections: readonly NavSection[] };
export type NavTop = NavLink & { readonly icon: IconName };
export type NavEntry = NavTop | NavGroup;

export const NAV = [
  { href: '/admin', label: 'داشبورد', icon: 'dashboard', acl: 'any' },
  {
    key: 'catalog',
    label: 'قطعات',
    icon: 'parts',
    sections: [
      {
        items: [
          { href: '/admin/catalog/categories', label: 'دسته‌بندی‌ها', acl: 'catalog.categories' },
          { href: '/admin/catalog/attributes', label: 'ویژگی‌ها', acl: 'catalog.attributes' },
          { href: '/admin/catalog/attribute-sets', label: 'مجموعه‌ی ویژگی‌ها', acl: 'catalog.attribute_sets' },
        ],
      },
    ],
  },
  {
    key: 'site',
    label: 'سایت',
    icon: 'system',
    sections: [
      {
        title: 'دسترسی‌ها',
        items: [
          { href: '/admin/system/users', label: 'همه‌ی کاربران', acl: 'system.users' },
          { href: '/admin/system/locked-users', label: 'کاربران قفل‌شده', acl: 'system.users' },
          { href: '/admin/system/roles', label: 'نقش‌های کاربری', acl: 'system.roles' },
        ],
      },
      {
        title: 'تنظیمات',
        items: [{ href: '/admin/system/config', label: 'تنظیمات سایت', acl: 'system.config' }],
      },
    ],
  },
] as const satisfies readonly NavEntry[];

// ---------- derived from NAV (nothing below needs editing when the menu changes) ----------

type Entry = (typeof NAV)[number];
type ItemOf<E> = E extends { readonly sections: readonly (infer S)[] } ? (S extends { readonly items: readonly (infer I)[] } ? I : never) : E;
type Item = ItemOf<Entry>;
type AclOf<I> = I extends { readonly acl: infer A } ? A : never;
type HrefOf<I> = I extends { readonly href: infer H } ? H : never;

/** Permission keys the panel uses — taken from the menu's acl values (the backend list: admin-permissions.ts). */
export type Permission = Exclude<AclOf<Item>, 'superadmin' | 'any'>;
/** Every menu URL; adminPage() only accepts these, so a page can't point at a missing / removed item. */
export type NavHref = HrefOf<Item>;

/** What the admin's token allows (GET /api/admin/auth/me). */
export type Access = { allPermissions: boolean; permissions: readonly string[] };

export function hasAccess(acl: Acl, access: Access | null): boolean {
  if (!access) return false;
  if (acl === 'any' || access.allPermissions) return true;
  return acl !== 'superadmin' && access.permissions.includes(acl);
}

export const isNavGroup = (e: NavEntry): e is NavGroup => 'sections' in e;

export type NavHit = { item: NavLink; group?: NavGroup; section?: NavSection };

/** The menu item whose href is exactly `href` (with its group / section). */
export function navItem(href: string): NavHit | undefined {
  for (const e of NAV as readonly NavEntry[]) {
    if (!isNavGroup(e)) {
      if (e.href === href) return { item: e };
      continue;
    }
    for (const section of e.sections) {
      const item = section.items.find((i) => i.href === href);
      if (item) return { item, group: e, section };
    }
  }
  return undefined;
}

/** Breadcrumb of a menu page: group › section. linkItem = for its sub-pages (new / edit): group › item (link). */
export function navCrumbs(hit: NavHit, linkItem = false): Crumb[] {
  const crumbs: Crumb[] = hit.group ? [{ label: hit.group.label }] : [];
  if (linkItem) crumbs.push({ label: hit.item.label, href: hit.item.href });
  else if (hit.section?.title) crumbs.push({ label: hit.section.title });
  return crumbs;
}

/** The item's label, for `export const metadata = { title: navLabel('/admin/…') }`. */
export const navLabel = (href: NavHref): string => navItem(href)!.item.label;

/** id of the hidden checkbox that opens the sidebar on small screens (AdminShell / AdminNav) */
export const NAV_TOGGLE_ID = 'admin-nav-toggle';
