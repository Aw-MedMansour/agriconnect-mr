// CI guard: every migration needs a rollback/recovery note and no unreviewed destructive SQL.
import { existsSync, readFileSync } from "node:fs";
import { ALLOW_DESTRUCTIVE_MARKER, findDestructive, loadMigrations } from "./migrate-lib";

let failed = false;
const notes = existsSync("db/RECOVERY.md") ? readFileSync("db/RECOVERY.md", "utf8") : "";
for (const m of loadMigrations("db/migrations")) {
  const hits = findDestructive(m.sql);
  if (hits.length && !m.sql.includes(ALLOW_DESTRUCTIVE_MARKER)) {
    console.error(`✗ ${m.tag}: destructive SQL without approval marker`);
    failed = true;
  }
  if (!notes.includes(`## ${m.tag}`)) {
    console.error(`✗ ${m.tag}: missing "## ${m.tag}" section in db/RECOVERY.md`);
    failed = true;
  } else console.log(`✓ ${m.tag}`);
}
process.exit(failed ? 1 : 0);
