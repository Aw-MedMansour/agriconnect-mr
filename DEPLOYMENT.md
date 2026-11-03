# AgriConnect MR — Self-hosted deployment (Docker / Coolify)

## Architecture
- App: TanStack Start (React 19, SSR + server functions) built by Vite/Nitro with the **node-server** preset, running on **Node.js 22** in Docker.
- Database, Auth, Storage: existing Supabase project (unchanged).
- AI (Plant AI chat, plant photo analysis): Lovable AI Gateway `https://ai.gateway.lovable.dev`, authenticated server-side with `LOVABLE_API_KEY`.
- Build target switch: `DEPLOY_TARGET=node` (set in the Dockerfile). Without it the default Cloudflare target is kept, so the current hosting keeps working.
- Internal port: **3000**. Health check: `GET /api/health`.

## Prerequisites
- Linux VPS with Docker 24+ and Docker Compose v2 (or Coolify v4).
- DNS `A` records for `agriconnect-mr.com` and `www` pointing to the VPS.
- Supabase URL + publishable key, and a `LOVABLE_API_KEY` for AI.

## Environment variables
| Variable | When | Required | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | build | yes | Public Supabase URL (browser) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | build | yes | Public key (browser, RLS-protected) |
| `VITE_SUPABASE_PROJECT_ID` | build | no | Public project id |
| `SUPABASE_URL` | runtime | yes | Server/SSR Supabase URL |
| `SUPABASE_PUBLISHABLE_KEY` | runtime | yes | Server/SSR public key |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime | no | Not used by current features |
| `LOVABLE_API_KEY` | runtime | for AI | Plant AI + photo analysis |
| `PORT` / `HOST` | runtime | no | Default `3000` / `0.0.0.0` |

The container refuses to start if required runtime variables are missing (see `docker/start.mjs`). Secrets are never baked into the image; only `VITE_*` public values are.

## Local Docker test
```bash
cp .env.example .env.production   # fill in values
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.local.yml up -d --build
curl http://localhost:3000/api/health
docker compose logs -f agriconnect
docker compose down
```

Without Compose:
```bash
docker build -t agriconnect-mr \
  --build-arg VITE_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx .
docker run -d --name agriconnect -p 127.0.0.1:3000:3000 --env-file .env.production --init agriconnect-mr
```

## Coolify
1. New Resource → **Docker Compose** → select the Git repository and branch; compose file: `docker-compose.yml`.
2. Environment Variables: add all variables above. Mark `VITE_*` as **Build Variable** too (they are passed as build args).
3. Service `agriconnect` → Domains: `https://agriconnect-mr.com,https://www.agriconnect-mr.com` (port 3000 is detected from `expose`; if asked, use `https://agriconnect-mr.com:3000` syntax per Coolify docs).
4. Deploy. Coolify's Traefik proxy issues Let's Encrypt HTTPS automatically once DNS points to the VPS.
5. Optional: redirect `www` → apex in Coolify (Redirect setting) to keep SEO canonical.
6. Supabase → Auth → URL configuration: add `https://agriconnect-mr.com` to Site URL / Redirect URLs.

## Logs
```bash
docker compose logs -f --tail=200 agriconnect
```
In Coolify: resource → **Logs**.

## Updating
```bash
git pull && docker compose --env-file .env.production up -d --build
```
In Coolify: push to the branch (auto-deploy webhook) or click **Redeploy**.

## Troubleshooting
| Symptom | Fix |
|---|---|
| `Missing required environment variable(s)` | Set runtime vars in Coolify / env file |
| Build fails `VITE_SUPABASE_URL ... required` | Provide build args / Coolify build variables |
| Blank page, "Missing Supabase environment variable" in browser | `VITE_*` were empty at build: rebuild |
| AI answers fail (401/402) | Check `LOVABLE_API_KEY` / gateway credits |
| 502 in Coolify | Container unhealthy: check logs, port must be 3000 |
| Login redirects to old domain | Update Supabase Auth Site URL / Redirect URLs |
| Built for Cloudflare (`.output` missing) | Ensure `DEPLOY_TARGET=node` during build |

## Remaining external dependencies
- Supabase (database, auth, storage, RPC functions).
- Lovable AI Gateway for AI features. Alternative: point `src/lib/agri-chat.functions.ts` and `src/lib/plant.functions.ts` at another OpenAI-compatible endpoint (e.g. OpenAI, Google Gemini) with its own server-side key.
- Google Fonts (if loaded from `__root.tsx`).
