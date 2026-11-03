# syntax=docker/dockerfile:1.7
# AgriConnect MR — production image (TanStack Start + Nitro node-server)

############################
# 1) Build stage (Bun)
############################
FROM oven/bun:1.2-alpine AS build
WORKDIR /app

# Public (browser-visible) values baked into the client bundle at build time.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
    DEPLOY_TARGET=node \
    NODE_ENV=production

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_PUBLISHABLE_KEY" \
    || (echo "ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY build args are required" && exit 1)
RUN bun run build && test -f .output/server/index.mjs

############################
# 2) Runtime stage (Node 22 LTS)
############################
FROM node:22-alpine AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
WORKDIR /app

# .output is self-contained (Nitro bundles server deps): no node_modules needed.
COPY --from=build --chown=node:node /app/.output ./.output
COPY --chown=node:node docker/start.mjs ./docker/start.mjs

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

STOPSIGNAL SIGTERM
CMD ["node", "docker/start.mjs"]
