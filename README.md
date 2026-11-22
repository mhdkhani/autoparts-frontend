# autoparts-frontend (Next.js)

Infra and compose files live in the separate `infra` repo. All config comes from `infra/.env` (no defaults in code).

## API URLs
- **Server-side** (SSR, server components): `API_INTERNAL_URL` — inside Docker `http://backend:3000`.
- **Browser**: `NEXT_PUBLIC_API_URL` (default `/api`) — routed to the backend by nginx.
  It is inlined at **build time**; pass it as a build arg, not a runtime env.

## Docker targets
- `dev` — `next dev`, used by `infra/docker-compose.dev.yml` with the source bind-mounted.
- `prod` (default) — `output: 'standalone'` server.

```bash
# NEXT_PUBLIC_API_URL is required (value from infra/.env)
docker build -t autoparts/frontend --build-arg NEXT_PUBLIC_API_URL=/api .
```
