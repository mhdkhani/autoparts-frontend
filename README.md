# autoparts-frontend (Next.js)

Infra and compose files live in the separate `infra` repo. All config comes from `infra/.env` (no defaults in code).

## Modules: `front` and `admin`

One Next.js app, two fully separate modules. Each has its **own root layout** (its own `<html>`,
global CSS, theme and — later — providers/auth). Moving between them is a full page load, so
nothing leaks from one into the other.

```
app/
  (front)/              # public store — URL /…
    layout.tsx          #   root layout + front theme
    page.tsx, hello/, not-found.tsx, [...missing]/
  (admin)/              # admin panel — URL /admin/…
    layout.tsx          #   root layout + admin theme (noindex)
    admin/layout.tsx    #   sidebar shell for panel pages
    admin/page.tsx, not-found.tsx, [...missing]/
modules/
  front/                # front components, styles, lib  → import as @front/...
  admin/                # admin components, styles, lib  → import as @admin/...
shared/                 # (create when needed) code both may use → @shared/...
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

## Docker targets
- `dev` — `next dev`, used by `infra/docker-compose.dev.yml` with the source bind-mounted.
- `prod` (default) — `output: 'standalone'` server.

The Dockerfile has no `ENV`/`ARG`: `NODE_ENV`, `PORT`, `BIND_HOST`, … all come from `infra/.env`
at runtime.

```bash
docker build -t autoparts/frontend .
```
