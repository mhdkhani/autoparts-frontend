FROM node:22-alpine AS base
# Recommended by Next.js for alpine (glibc shims used by some native deps)
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

# --- development: source is bind-mounted by infra/docker-compose.dev.yml
FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY . .
# NEXT_PUBLIC_* values are inlined into the JS bundle at build time:
# pass them from infra/.env, e.g. --build-arg NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN test -n "$NEXT_PUBLIC_API_URL" || { echo "build arg NEXT_PUBLIC_API_URL is required"; exit 1; }
RUN npm run build

# --- production (default target)
FROM base AS prod
# PORT comes from infra/.env at runtime
ENV NODE_ENV=production HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
