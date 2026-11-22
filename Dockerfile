# No ENV / ARG / ports here: at runtime every setting (NODE_ENV, PORT,
# BIND_HOST, API_INTERNAL_URL, PUBLIC_API_URL, …) comes from infra/.env via
# compose env_file. Nothing is baked in at build time, so one image fits every env.
FROM node:22-alpine AS base
# Recommended by Next.js for alpine (glibc shims used by some native deps)
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

# --- development: source is bind-mounted by infra/docker-compose.dev.yml
FROM deps AS dev
COPY . .
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY . .
RUN npm run build

# --- production (default target)
FROM base AS prod
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
# The standalone server listens on $HOSTNAME, which Docker sets to the container
# id; point it at BIND_HOST from infra/.env instead.
CMD ["sh", "-c", "HOSTNAME=\"$BIND_HOST\" exec node server.js"]
