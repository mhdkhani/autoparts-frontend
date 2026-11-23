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
    admin/(panel)/      #   sidebar shell + session check; dashboard, not-found, [...missing]
      system/users/, system/locked-users/, system/roles/, system/config/[section]/
modules/
  front/                # front components, styles, lib  → import as @front/...
  admin/                # admin components (system/, config/), styles, lib  → import as @admin/...
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
- Sidebar (`modules/admin/components/AdminNav.tsx`): collapsible groups; an item with a `permission` is shown only
  if the session has it (`session.permissions` from `/me`).
- Pages under `app/(admin)/admin/(panel)/system/`: `users` (list, `new`, `[id]` edit), `locked-users`, `roles`
  (list, `new`, `[id]` edit/delete). Each page checks `can(session, '<permission>')` and shows `<Forbidden />` otherwise.
- Server pages read with `adminGet()` (`lib/api.ts` → `backendFetch()` with the token from the cookie).
  Client forms write with `adminSend()` (`lib/client-api.ts`) through the `/admin/api` proxy.
- Hiding menu items / pages is only for the UI: every admin API checks the token and the role's ACL itself.
- Shared page styles: `modules/admin/components/ui.module.css`. Dates: `faDate()` (Jalali, Tehran time).

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
