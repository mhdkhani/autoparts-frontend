// ⭐ The panel menu — the ONE place to change it (PROJECT-NOTES §8).
// Everything else reads from here: the sidebar (AdminNav), who may open each page (adminPage() in auth.ts),
// breadcrumbs, page titles, the «در حال ساخت» page, and the frontend's list of permission keys (Permission).
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
  /** not built yet: the catch-all page shows «در حال ساخت» */
  readonly soon?: boolean;
};
export type NavSection = { readonly title?: string; readonly items: readonly NavLink[] };
export type NavGroup = { readonly key: string; readonly label: string; readonly icon: IconName; readonly sections: readonly NavSection[] };
export type NavTop = NavLink & { readonly icon: IconName };
export type NavEntry = NavTop | NavGroup;

/** A section that isn't built yet. When it is: build its page at `href`, drop `soon`, set its permission key as acl. */
const soon = <H extends string, A extends Acl>(href: H, label: string, acl: A) => ({ href, label, acl, soon: true }) as const;

export const NAV = [
  { href: '/admin', label: 'داشبورد', icon: 'dashboard', acl: 'any' },
  {
    key: 'vehicles',
    label: 'خودروها',
    icon: 'vehicles',
    sections: [
      {
        items: [
          soon('/admin/vehicles/manufacturers', 'کمپانی‌های سازنده', 'superadmin'),
          soon('/admin/vehicles/brands', 'برندهای عرضه', 'superadmin'),
          soon('/admin/vehicles/models', 'مدل‌ها و خانواده‌ها', 'superadmin'),
          soon('/admin/vehicles/generations', 'نسل‌ها', 'superadmin'),
          soon('/admin/vehicles/variants', 'تیپ و نسخه‌ها', 'superadmin'),
          soon('/admin/vehicles/engines', 'موتورها', 'superadmin'),
        ],
      },
    ],
  },
  {
    key: 'catalog',
    label: 'قطعات',
    icon: 'parts',
    sections: [
      {
        items: [
          soon('/admin/catalog/products', 'محصولات', 'superadmin'),
          soon('/admin/catalog/categories', 'دسته‌بندی‌ها', 'superadmin'),
          soon('/admin/catalog/attributes', 'ویژگی‌ها', 'superadmin'),
          soon('/admin/catalog/part-brands', 'برندهای قطعه', 'superadmin'),
          soon('/admin/catalog/part-numbers', 'شماره‌های فنی', 'superadmin'),
          soon('/admin/catalog/fitment', 'سازگاری‌ها', 'superadmin'),
        ],
      },
    ],
  },
  {
    key: 'pricing',
    label: 'قیمت و موجودی',
    icon: 'pricing',
    sections: [
      {
        items: [
          soon('/admin/pricing/bulk-edit', 'ویرایش گروهی', 'superadmin'),
          soon('/admin/pricing/stock-statuses', 'وضعیت‌های موجودی', 'superadmin'),
          soon('/admin/pricing/discounts', 'قیمت ویژه و تخفیف', 'superadmin'),
        ],
      },
    ],
  },
  {
    key: 'sales',
    label: 'فروش',
    icon: 'sales',
    sections: [
      {
        items: [
          soon('/admin/sales/orders', 'سفارش‌ها', 'superadmin'),
          soon('/admin/sales/customers', 'مشتری‌ها', 'superadmin'),
        ],
      },
    ],
  },
  {
    key: 'search',
    label: 'جستجو',
    icon: 'search',
    sections: [
      {
        items: [
          soon('/admin/search/aliases', 'نام‌های جایگزین', 'superadmin'),
          soon('/admin/search/synonyms', 'مترادف‌ها', 'superadmin'),
          soon('/admin/search/no-results', 'جستجوهای بی‌نتیجه', 'superadmin'),
          soon('/admin/search/part-requests', 'درخواست‌های قطعه', 'superadmin'),
        ],
      },
    ],
  },
  {
    key: 'import',
    label: 'ورود داده',
    icon: 'import',
    sections: [
      {
        items: [
          soon('/admin/import/files', 'ایمپورت اکسل و CSV', 'superadmin'),
          soon('/admin/import/duplicates', 'موارد مشکوک به تکرار', 'superadmin'),
        ],
      },
    ],
  },
  {
    key: 'content',
    label: 'محتوا',
    icon: 'content',
    sections: [
      {
        items: [
          soon('/admin/content/pages', 'صفحات', 'superadmin'),
          soon('/admin/content/sliders', 'اسلایدرها', 'superadmin'),
          soon('/admin/content/seo', 'سئو', 'superadmin'),
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
      {
        title: 'گزارش‌ها',
        items: [
          soon('/admin/system/audit-log', 'سوابق تغییرات', 'superadmin'),
          soon('/admin/system/errors', 'خطاهای مهم', 'superadmin'),
        ],
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
