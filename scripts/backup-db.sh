#!/usr/bin/env sh
# Creates a compressed custom-format pg_dump, verifies it, and applies the retention policy.
# Env: DATABASE_URL (or PG* vars), BACKUP_DIR (default /backups), BACKUP_RETENTION_DAYS (default 14)
set -eu
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"
LABEL="${1:-scheduled}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/agriconnect-${STAMP}-${LABEL}.dump"
TMP="$FILE.partial"

echo "[backup] dumping to $FILE"
pg_dump ${DATABASE_URL:+"$DATABASE_URL"} --format=custom --compress=9 --no-owner --no-privileges --file="$TMP"
mv "$TMP" "$FILE"
sha256sum "$FILE" > "$FILE.sha256"
"$(dirname "$0")/verify-backup.sh" "$FILE"

echo "[backup] removing backups older than ${RETENTION} days"
find "$BACKUP_DIR" -name 'agriconnect-*.dump' -mtime +"$RETENTION" -print -delete
find "$BACKUP_DIR" -name 'agriconnect-*.dump.sha256' -mtime +"$RETENTION" -delete
echo "[backup] OK $FILE"
