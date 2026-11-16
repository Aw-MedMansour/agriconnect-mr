# AgriConnect MR — Self-hosted deployment (Docker / Coolify, PostgreSQL 18.7)

## 1. Architecture
| Service | Image | Role |
|---|---|---|
| `db` | `postgres:18.7-alpine3.24` | Database. Volume `pgdata` → `/var/lib/postgresql` (PostgreSQL 18 layout: data lives in `/var/lib/postgresql/18/docker`). Port 5432 is **not** published. |
| `migrate` | built from `Dockerfile` (target `migrator`) | One-shot job per deployment: waits for the DB, takes a verified backup if the database already exists and migrations are pending, applies migrations under an advisory lock, exits non-zero on failure. |
| `app` | built from `Dockerfile` (target `runtime`) | Node 22 server, non-root, port 3000. Starts **only** after `migrate` succeeded. Volume `media` → `/app/data/media`. Health: `/api/ready` (DB reachable), liveness `/api/health`. |
| `backup` | migrator image | `pg_dump` every `BACKUP_INTERVAL_HOURS`, verified, retention `BACKUP_RETENTION_DAYS`, volume `backups` (separate from `pgdata`). |

External services: none for data. `LOVABLE_API_KEY` is only needed for the two AI features.

## 2. Environment
```bash
cp .env.example .env.production
openssl rand -base64 48   # run twice: SESSION_SECRET and MEDIA_SIGNING_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD (also put it inside DATABASE_URL)
```
Required: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL` (`postgres://USER:PASSWORD@db:5432/DB`), `SESSION_SECRET`, `MEDIA_SIGNING_SECRET` (32+ chars). Optional: `LOVABLE_API_KEY`, `BACKUP_INTERVAL_HOURS` (24), `BACKUP_RETENTION_DAYS` (14). Compose refuses to start if a required value is missing; the app refuses to start with weak secrets.

## 3. Local test
```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.local.yml up -d --build
docker compose logs migrate          # must end with "[migrate] done."
curl http://localhost:3000/api/ready # {"status":"ready"}
```

## 4. Coolify
1. New resource → **Docker Compose** → repository + branch, file `docker-compose.yml`.
2. Add the variables of section 2 (no build variables are needed any more).
3. Domain on service `app`, port 3000: `https://agriconnect-mr.com,https://www.agriconnect-mr.com`.
4. Deploy. Coolify waits for `migrate` to complete successfully before starting `app`; a failed migration leaves the previous version running and the new one unhealthy.
5. Never enable "delete volumes" on redeploy.

## 5. Deployment sequence (what happens on each deploy)
1. `db` starts / is verified healthy (`pg_isready`).
2. `migrate`: connectivity check → if the database already has migrations and new ones are pending, `scripts/backup-db.sh pre-migration` (verified) → migrations applied once (advisory lock, each in its own transaction, logged in `drizzle.migration_runs`) → constraint validation.
3. `app` starts → healthcheck `/api/ready`.
4. Manual smoke test: sign in, publish with a photo, send a message, open notifications.

## 6. Database changes (developers)
```bash
# edit src/server/db/schema.ts
bun run db:generate --name add_x       # creates db/migrations/NNNN_add_x.sql
# review the SQL, add "## NNNN_add_x" with rollback/recovery notes to db/RECOVERY.md
TEST_DATABASE_URL=postgres://... bun run test
bun run db:check
git add src/server/db/schema.ts db/migrations db/RECOVERY.md   # commit together
```
Rules: never edit an applied migration; never `drizzle-kit push` in production; destructive changes use expand-and-contract (add nullable column → backfill & switch code → drop in a later, separately approved release with the `-- migrate:allow-destructive` marker and a verified backup).

Inspect history: `docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB -c "select tag,status,duration_ms,error,started_at from drizzle.migration_runs order by id"`.

## 7. Backups
```bash
docker compose exec backup /scripts/backup-db.sh manual          # on demand
docker compose exec backup ls -l /backups
docker compose exec backup /scripts/verify-backup.sh /backups/<file>.dump
```
Copy backups off the server regularly (e.g. `docker compose cp backup:/backups ./offsite`).

## 8. Restore (explicit confirmation required)
```bash
docker compose stop app
docker compose run --rm -e CONFIRM_RESTORE=agriconnect migrate /scripts/restore-db.sh /backups/<file>.dump
docker compose start app
```
The script verifies the archive, refuses without `CONFIRM_RESTORE=<database name>`, takes a safety backup of the current state, then restores in a single transaction.

## 9. Recovery after a failed migration
- The failed migration was rolled back by its transaction; the database is at the previous version and the old app version keeps running.
- Read the error: `docker compose logs migrate` and `drizzle.migration_runs`.
- Fix forward with a **new** migration (never edit an applied one), redeploy.
- If data was damaged by an earlier, successful migration: restore the `pre-migration` backup (section 8) and redeploy the previous app version.

## 10. Importing data from the previous hosted database (optional, one time)
Needs: the old database connection string (`SOURCE_DATABASE_URL`) and, for files, the old storage URL and service key.
```bash
docker compose run --rm -e SOURCE_DATABASE_URL=... -e SOURCE_STORAGE_URL=https://<old-project>.supabase.co \
  -e SOURCE_SERVICE_KEY=... -e MEDIA_DIR=/app/data/media -e MEDIA_SIGNING_SECRET=$MEDIA_SIGNING_SECRET \
  -v agriconnect_media:/app/data/media <dev image with bun> bun scripts/supabase-import/import.ts --dry-run
# then without --dry-run; the report import-report-*.json lists counts, failures and password resets
```
- Identifiers and timestamps are preserved; rows already imported are skipped (safe to retry).
- Media files are downloaded, validated, stored on the volume, checksummed, and old storage URLs in posts/products are rewritten to new signed URLs (`unresolvedUrls` must be 0).
- Old bcrypt password hashes are verified at the member's next login and upgraded to Argon2id. Accounts without a usable hash are flagged in `passwordResetRequired`; set a password with `NEW_PASSWORD=... bun scripts/set-password.ts email`.
- The old data is never modified or deleted.

## 11. Admin
`DATABASE_URL=... bun scripts/grant-admin.ts admin@example.com` — admins can delete any publication.

## 12. Troubleshooting
| Symptom | Fix |
|---|---|
| `app` never starts | `docker compose logs migrate` — a migration failed or the DB is unreachable. |
| `Missing or invalid environment variable(s)` | Set the listed variables (secrets must be 32+ chars). |
| `/api/ready` 503 | Database down or wrong `DATABASE_URL`. |
| Uploads fail with 500 | Volume `media` not writable by uid 1000 (`node`). |
| Login loops on http:// | Cookies are `Secure` in production; use HTTPS (or `docker-compose.local.yml` locally). |
| Old PostgreSQL 16 volume | Do not mount it as-is: dump with the old version and restore into the new `pgdata` volume. |
