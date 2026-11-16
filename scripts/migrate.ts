// CLI: bun scripts/migrate.ts [--dry-run]   (bundled to dist-tools/migrate.mjs for the Docker image)
import { resolve } from "node:path";
import { runMigrations, waitForDatabase } from "./migrate-lib";

const url = process.env["DATABASE_URL"];
if (!url) { console.error("[migrate] DATABASE_URL is required"); process.exit(1); }
const dir = resolve(process.env["MIGRATIONS_DIR"] || "db/migrations");
const dryRun = process.argv.includes("--dry-run");

try {
  await waitForDatabase(url, console.log);
  const r = await runMigrations({ url, dir, dryRun });
  console.log(`[migrate] done. applied=${r.applied.length} pending=${r.pending.length}`);
  process.exit(0);
} catch (e) {
  console.error(`[migrate] FAILED: ${(e as Error).message}`);
  process.exit(1);
}
