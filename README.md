# autoparts-frontend (Next.js)

Infra and compose files live in the separate `infra` repo. All config comes from `infra/.env` (no defaults in code).

## Modules: `front` and `admin`

One Next.js app, two fully separate modules. Each has its **own root layout** (its own `<html>`,
global CSS, theme and — later — providers/auth). Moving between them is a full page load, so
nothing leaks from one into the other.

```
middleware.ts           # /admin/* pages without the admin cookie → /admin/login
app/
  (front)/              # public store — URL /…
    layout.tsx          #   root layout + front theme
    page.tsx, hello/, not-found.tsx, [...missing]/
  (admin)/              # admin panel — URL /admin/…
    layout.tsx          #   root layout + admin theme (noindex)
    admin/api/[...path]/route.ts   # proxy to the admin API (adds Authorization: Bearer)
    admin/login/        #   login form (no sidebar)
    admin/(panel)/      #   sidebar shell + session check; dashboard, not-found,
                        #   [...missing] (any /admin/* URL without a page → the panel's 404)
      catalog/categories/, catalog/attributes/, catalog/attribute-sets/
      system/users/, system/locked-users/, system/roles/, system/config/[section]/
modules/
  front/                # front components, styles, lib  → import as @front/...
  admin/                # admin module  → import as @admin/...
    components/ui/      #   the panel's own UI kit (see below)
    components/         #   shell, sidebar, catalog/, system/ and config/ pages' components
    fonts/              #   Vazirmatn (self-hosted, next/font/local), admin only
    lib/nav.ts          #   ⭐ the admin menu + each item's acl — the only file to edit for menu changes
    styles/global.css   #   color tokens (--c-primary, …) + font
shared/                 # code both may use → @shared/...  (backend.ts: backendFetch)
```

Route files in `app/` stay thin; real code lives in `modules/<name>/`.

**Rule:** `front` and `admin` never import each other (aliases or relative paths). Code both need
goes into `shared/`, which may import neither. `npm run check:boundaries` enforces this, and it runs
automatically before every `npm run build` — a violation fails the build.

Each module has its own 404: unknown `/…` URLs → `app/(front)/not-found.tsx`,
unknown `/admin/…` URLs → `app/(admin)/admin/not-found.tsx` (inside the admin theme).

## API URLs
- **Server-side** (SSR, server components): `API_INTERNAL_URL` — inside Docker `http://backend:3000`.
- **Browser**: `PUBLIC_API_URL` (`/api`) — routed to the backend by nginx. It is read on the
  server at request time and passed to client components as a prop.

Don't use `NEXT_PUBLIC_*` variables: Next.js bakes them into the bundle at build time, which
would tie the image to one environment. Nothing is baked in, so one image fits every env.

## ⭐ Rule: how every API call is made (admin and front)
The API authenticates with **`Authorization: Bearer <token>` only** and must receive **no cookies and no extra headers**.

- **From Next.js server code** (server components, route handlers): always `backendFetch()` from
  `shared/backend.ts`. It sends only `Authorization` (when there is a token), `Content-Type`/`Content-Length`
  (when there is a body) and `X-Forwarded-For` only for rate-limited login/register — built on `node:http`,
  because `fetch()` would add user-agent / accept / cache-control … by itself.
- **From the browser to the API directly** (public data, e.g. `ClientHealth`): `fetch(…, { credentials: 'omit' })`
  — no cookies at all.
- **Tokens stay out of JavaScript:** a module keeps its token in an httpOnly cookie *scoped to its own pages*
  (admin: `ap_admin`, `Path=/admin`), never sent to `/api/*`. Browser code calls the module's Next.js proxy,
  which adds the Bearer header server-side (admin: `/admin/api/*`). The storefront's customer login will use the
  same pattern when it is built.

## Admin login and the `/admin/api` proxy
```
browser ──(httpOnly ap_admin cookie, Path=/admin)──▶ /admin/api/* (Next route handler) ──(Bearer only)──▶ /api/admin/*
```
1. `app/(admin)/admin/api/[...path]/route.ts` — the proxy. A response with `{ token, expiresAt }` (login, own
   password change) is stored in the cookie and removed from the body; logout / logout-all / any 401 deletes it.
2. `middleware.ts` — `/admin/*` pages without the cookie → `/admin/login?next=<path>` (presence check only;
   `/admin/api/*` is left to the proxy, which answers 401 JSON).
3. `app/(admin)/admin/(panel)/layout.tsx` — verifies the token with `GET /api/admin/auth/me`
   (`getAdminSession()` in `modules/admin/lib/auth.ts`, cached per request); invalid / revoked → `/admin/login`.
4. `/admin/login` — signed-in admins are sent on to `next` (only `/admin…` paths are accepted).
5. `LoginForm` (username or email) posts to `/admin/api/auth/login`; `LogoutButton` to `/admin/api/auth/logout`
   (the API revokes the token, the proxy deletes the cookie).

The real protection is the backend: every admin API endpoint checks the token and the role's permissions again.

## Admin permissions UI («سایت › دسترسی‌ها»)
- ⭐ **Menu = one file:** `modules/admin/lib/nav.ts`. Every item must declare its `acl`: `'superadmin'` (only a role
  with all permissions), a permission key (roles that have it), or `'any'` (dashboard only). The sidebar (`AdminNav.tsx`),
  page access (`adminPage(href)` in `lib/auth.ts`), breadcrumbs, page titles (`navLabel`) and
  the `Permission` / `NavHref` types are all derived from it — there is no second list of permission keys.
  `adminPage()` only accepts hrefs that exist in the menu, so removing an item breaks its page's typecheck (fail-closed).
- ⭐ **Only working sections are in the menu** — no «coming soon» placeholders. A section's item is added to `nav.ts`
  when its page is built. Below 768px the sidebar slides in from the right (☰ in the header).
- Pages under `app/(admin)/admin/(panel)/system/`: `users` (list, `new`, `[id]` edit), `locked-users`, `roles`
  (list, `new`, `[id]` edit/delete). Each page starts with `const page = await adminPage('<menu href>')` and shows
  `<Forbidden />` when it returns null; `page.title` / `page.crumbs` come from the menu. `can(session, key)` is only for
  checks inside a page.
- Server pages read with `adminGet()` (`lib/api.ts` → `backendFetch()` with the token from the cookie).
  Client forms write with `adminSend()` (`lib/client-api.ts`) through the `/admin/api` proxy.
- ⭐ Every form saves / deletes through `useAdminForm(listHref)` (`lib/client-api.ts`): busy state, the server's error,
  success toast, back to the list, and a confirm dialog before a delete:
  `form.send('PUT', '/roles/1', body, 'ذخیره شد.')`, `form.send('DELETE', '/roles/1', undefined, 'حذف شد.', { title, message })`.
- Hiding menu items / pages is only for the UI: every admin API checks the token and the role's ACL itself.
- Dates: `faDate()` (Jalali, Tehran time).

## Admin UI kit (`modules/admin/components/ui`)
Build every panel page from these (Ant Design was tried and rejected) — `import { … } from '@admin/components/ui'`:

- Files: `base.tsx` (`cx`, `Icon`, `Button`, `PageHeader`, `Card`, `EmptyState`, `StatusBadge`), `DataTable.tsx`, `form.tsx`,
  `UiProvider.tsx`, `ui.module.css`, `index.ts`. Add new pieces to these files — no new files, no copies.
- `PageHeader` (title, breadcrumb `crumbs`, `subtitle`, `actions`), `Button` (`variant`, `size`, `loading`, `href`),
  `Card` (`title`, `description`, `flush`), `Icon` (every panel icon), `EmptyState`, `StatusBadge` (`tone`).
- `DataTable` + `Pagination`: columns as `Column<T>` (`render`, `link`, `sortable`, `ltr`, `wrap`); search / sort / page live
  in the URL (`?q=&sort=&dir=&page=`). `readTableState(searchParams, …)` reads them; `sortAndPage(rows, state, SORT, searchIn?)`
  searches, sorts and slices a full list in memory for APIs that return everything (see `system/users/page.tsx`).
  `search="…"` on `DataTable` adds a search box (plain GET form); `searchIn` returns the texts of a row to match — every
  word must appear, Arabic «ي/ك», half-space and case are ignored (see `catalog/attributes/page.tsx`).
- Forms: `Form`, `Field`, `Input` / `Textarea` (`ltr`), `Select`, `Checkbox`, `Fieldset`, `FormError` (scrolls itself into
  view when an error appears), `FormActions`. Ordered lists: `OrderButtons` (▲ ▼ ✕) + `moveItem()`.
- `Tabs`: tabs of a form (the groups of an attribute set); panels stay mounted, `active` / `onSelect` switch from outside.
- `FieldControl`: the input for one field from a `FieldSpec` (`text`, `textarea`, `editor`, `boolean`, `select` — `placeholder`
  adds an empty choice —, `image`; values are strings). `editor` is the kit's own text editor (no library: bold, italic,
  underline, H2 / H3, lists, links, clear formatting; pasting inserts plain text) for `is_wysiwyg` attributes — its HTML
  is only trusted after the API has cleaned it. Image fields need `uploadImage`, e.g. `(f) => adminUpload('/config/upload', f)`. Used by the settings form and
  the category form (and later the product form).
- `useToast()` (`toast.success` / `toast.error`) and `useConfirm()` (`await confirm({ title, message, danger })`),
  provided by `UiProvider` inside `AdminShell` — a toast shown before `router.push()` stays visible on the next page.
- Colors are CSS variables in `modules/admin/styles/global.css`; change them there, not in components.

## Categories («قطعات › دسته‌بندی‌ها»)
- `catalog/categories`: the tree as an indented table (parents first, children by position), «+ زیرشاخه» per row;
  `new` (`?parent=<id>` preselects the parent), `[id]` edit / delete (disabled while it has children).
- `CategoryForm`: parent (the tree, minus the category's own sub-tree) and order, then the category set as `Tabs`
  («عمومی», «محتوا», «سئو»), one `FieldControl` per field. Tabs, fields, required flags and defaults all come from the
  `form` the API returns — nothing is hard-coded. A required field left empty switches to its tab.
- `categoryTree()` in `lib/types.ts` orders the tree for both.

## Attributes («قطعات › ویژگی‌ها» / «مجموعه‌ی ویژگی‌ها»)
Magento-style EAV, backend `src/modules/catalog/attributes` (see the backend README). The panel shows and makes
product attributes only; category attributes are installed with the project.
- `catalog/attributes`: list with search (title / code), `new`, `[id]` — `AttributeForm`: titles, code and type (fixed after
  creation), unit / min / max (numbers), max length (texts), options with a fixed English code (select / multiselect),
  help text, «فیلتر» and «جستجو». Delete is disabled while the attribute is in a set.
- `catalog/attribute-sets`: list, `new` (`?from=<id>` = copy of a set), `[id]` — `AttributeSetForm`: groups (ordered), each
  group's attributes (ordered, «اجباری», move to another group); the whole set is saved at once.
- Labels of the attribute types and the type groups (`OPTION_TYPES`, …) are in `lib/types.ts`, mirroring the backend.

## Site settings page («سایت › تنظیمات سایت»)
- `/admin/system/config` → first section; `/admin/system/config/[section]` shows the side list (categories →
  sections) and the section form (`modules/admin/components/config/`).
- The form is generated from the backend definition (`backend/src/modules/site-config/config.definition.ts`):
  groups become cards, fields become label | control rows. New settings need no frontend change, unless a new
  field *type* is added (then add it to `FieldControl` in `ConfigSectionForm.tsx` and to `types.ts`).
- Only changed fields are sent on Save; leaving with unsaved changes asks for confirmation.
- Images (logo) are uploaded first (`POST /api/admin/config/upload`), the returned `/media/…` URL is saved as the value.

## Docker targets
- `dev` — `next dev`, used by `infra/docker-compose.dev.yml` with the source bind-mounted.
- `prod` (default) — `output: 'standalone'` server.

The Dockerfile has no `ENV`/`ARG`: `NODE_ENV`, `PORT`, `BIND_HOST`, … all come from `infra/.env`
at runtime.

```bash
docker build -t autoparts/frontend .
```
