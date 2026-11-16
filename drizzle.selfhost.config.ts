// Self-hosted PostgreSQL 18 schema & migrations (the only schema used at runtime).
// `drizzle/` + drizzle.config.ts are the legacy hosted-database history and are not used by the self-hosted app.
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
