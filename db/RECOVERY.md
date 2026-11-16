# Migration recovery notes

Every file in `db/migrations/` needs a section here (checked in CI by `bun run db:check`).
Applied migrations are never edited and never rolled back automatically. A failed migration
is rolled back by its own transaction; recovery is a **forward fix** (new migration) or a
**restore of the verified backup** taken just before deployment (`scripts/restore-db.sh`).

## 0000_init
- Creates the initial schema (accounts, sessions, roles, profiles, content, conversations, notifications, media).
- Reversible only on an empty database. Rollback SQL (empty database only — destroys data):
  `DROP TABLE conversation_participants, notifications, media_files, sessions, user_roles, rate_limits, profiles, posts, products, services, conversations, accounts CASCADE; DROP TYPE app_role; DELETE FROM drizzle.__drizzle_migrations;`
- With data present: restore the pre-deployment backup instead.
