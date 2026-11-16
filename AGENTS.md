<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the installable-site manifest in `public/site.webmanifest` and source its icon URLs from asset pointers; mobile home-screen icons need explicit sizes and a nontransparent background.

- Self-hosting: build with `DEPLOY_TARGET=node` (vite.config.ts) for the Nitro node-server preset; default stays Cloudflare so editor hosting keeps working. Docker liveness is `/api/health`, readiness `/api/ready`.
- Data layer: self-hosted PostgreSQL 18 via Drizzle + Postgres.js; `src/server/db/schema.ts` is the only schema source and `db/migrations/` (applied by `scripts/migrate-lib.ts`, never `drizzle-kit push`) its history. `drizzle/` and `supabase/` are retired hosted-database history — why: the app no longer depends on Supabase at runtime.
- Browser code never queries the database: it calls server functions in `src/lib/*.functions.ts`, which derive the user from the HttpOnly session cookie and enforce rules in `src/server/services/` — why: authorization formerly done by RLS now lives server-side and is covered by `tests/`.
- Every new migration needs a `## <tag>` recovery section in `db/RECOVERY.md`; destructive SQL requires the `-- migrate:allow-destructive` marker after review — why: the runner and CI refuse otherwise.
- Media files live on the MEDIA_DIR volume, served by `/api/media/$id` with HMAC-signed URLs; never store binaries in PostgreSQL.
- Final migration verification is read-only and fail-closed: compare source IDs, timestamps, relationships and original-file hashes against the VPS, then audit stored URLs and requests; missing access or orphaned records must block retirement, not count as success.
