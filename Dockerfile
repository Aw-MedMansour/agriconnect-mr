# syntax=docker/dockerfile:1.7
# AgriConnect MR — app image (TanStack Start / Node 22) and migrator image (PostgreSQL 18.7 tools + Node).

############################
# 1) Build (Bun)
############################
FROM oven/bun:1.2-alpine AS build
WORKDIR /app
ENV DEPLOY_TARGET=node NODE_ENV=production
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build && test -f .output/server/index.mjs
RUN bun run build:tools && test -f dist-tools/migrate.mjs

############################
# 2) Migrator / backup tools (one-shot job + backup sidecar)
############################
FROM postgres:18.7-alpine3.24 AS migrator
RUN apk add --no-cache nodejs
WORKDIR /app
COPY --from=build /app/dist-tools ./dist-tools
COPY db/migrations ./db/migrations
COPY scripts/backup-db.sh scripts/verify-backup.sh scripts/restore-db.sh scripts/backup-cron.sh scripts/predeploy.sh /scripts/
RUN chmod +x /scripts/*.sh
ENV MIGRATIONS_DIR=/app/db/migrations
CMD ["/scripts/predeploy.sh"]

############################
# 3) App runtime (default target)
############################
FROM node:22-alpine AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 MEDIA_DIR=/app/data/media
WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
COPY --chown=node:node docker/start.mjs ./docker/start.mjs
RUN mkdir -p /app/data/media && chown -R node:node /app/data
USER node
EXPOSE 3000
VOLUME ["/app/data/media"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/ready || exit 1
STOPSIGNAL SIGTERM
CMD ["node", "docker/start.mjs"]
