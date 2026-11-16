#!/usr/bin/env sh
# Restores a verified backup into the target database. DESTRUCTIVE for the target: requires
# explicit confirmation and takes a safety backup of the current state first.
# Usage: CONFIRM_RESTORE=<database name> scripts/restore-db.sh <file.dump>
set -eu
FILE="${1:?usage: CONFIRM_RESTORE=<dbname> restore-db.sh <file.dump>}"
: "${DATABASE_URL:?DATABASE_URL is required}"
DIR="$(dirname "$0")"
"$DIR/verify-backup.sh" "$FILE"
DBNAME="$(psql "$DATABASE_URL" -Atc 'select current_database()')"
if [ "${CONFIRM_RESTORE:-}" != "$DBNAME" ]; then
  echo "[restore] refusing: set CONFIRM_RESTORE=$DBNAME to confirm overwriting database '$DBNAME'."
  exit 2
fi
echo "[restore] safety backup of the current database first"
"$DIR/backup-db.sh" pre-restore
echo "[restore] restoring $FILE into $DBNAME (single transaction)"
pg_restore --dbname="$DATABASE_URL" --clean --if-exists --no-owner --no-privileges --single-transaction --exit-on-error "$FILE"
psql "$DATABASE_URL" -Atc "select count(*) || ' migrations recorded' from drizzle.__drizzle_migrations"
echo "[restore] OK. Restart the app: docker compose up -d app"
