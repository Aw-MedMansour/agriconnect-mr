#!/usr/bin/env sh
# One-shot deployment step: wait for DB, back up an existing database, apply pending migrations.
set -eu
until pg_isready -d "$DATABASE_URL" -q; do echo "[predeploy] waiting for database…"; sleep 2; done
HAS="$(psql "$DATABASE_URL" -Atc "select to_regclass('drizzle.__drizzle_migrations') is not null")"
PENDING="$(node /app/dist-tools/migrate.mjs --dry-run | grep -c '\[migrate\] pending' || true)"
if [ "$HAS" = "t" ] && [ "$PENDING" != "0" ]; then
  echo "[predeploy] existing database with pending migrations: verified backup first"
  /scripts/backup-db.sh pre-migration
fi
node /app/dist-tools/migrate.mjs
