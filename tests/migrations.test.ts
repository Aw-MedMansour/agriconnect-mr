import { describe, it, expect } from "vitest";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postgres from "postgres";
import { findDestructive, runMigrations } from "../scripts/migrate-lib";
import { MIGRATIONS, freshDatabase } from "./helpers";

const quiet = () => {};

function copyMigrations() {
  const dir = mkdtempSync(join(tmpdir(), "mig-"));
  cpSync(MIGRATIONS, dir, { recursive: true });
  return dir;
}
function addMigration(dir: string, tag: string, sqlText: string) {
  const jp = join(dir, "meta", "_journal.json");
  const j = JSON.parse(readFileSync(jp, "utf8"));
  const last = j.entries[j.entries.length - 1];
  j.entries.push({ idx: last.idx + 1, version: "7", when: last.when + 1000, tag, breakpoints: true });
  writeFileSync(jp, JSON.stringify(j));
  writeFileSync(join(dir, `${tag}.sql`), sqlText);
}

describe("migration runner", () => {
  it("applies all migrations on an empty PostgreSQL 18 database and builds the expected schema", async () => {
    const f = await freshDatabase("mig");
    const sql = postgres(f.url, { max: 1, onnotice: quiet });
    try {
      const r = await runMigrations({ url: f.url, dir: MIGRATIONS, log: quiet });
      expect(r.applied).toEqual(["0000_init"]);
      const [{ v }] = await sql`select current_setting('server_version_num')::int as v`;
      expect(v).toBeGreaterThanOrEqual(180000);
      const tables = (await sql`select table_name from information_schema.tables where table_schema='public' order by 1`).map((t) => t.table_name);
      expect(tables).toEqual(["accounts", "conversation_participants", "conversations", "media_files", "notifications", "posts", "products", "profiles", "rate_limits", "services", "sessions", "user_roles"]);
      const fks = await sql`select conname, confdeltype from pg_constraint where contype='f' and connamespace='public'::regnamespace`;
      expect(fks.length).toBe(11);
      expect(fks.find((f) => f.conname === "notifications_actor_id_accounts_id_fk")?.confdeltype).toBe("n"); // SET NULL
      expect(fks.find((f) => f.conname === "sessions_user_id_accounts_id_fk")?.confdeltype).toBe("c");        // CASCADE
      const idx = (await sql`select indexname from pg_indexes where schemaname='public'`).map((i) => i.indexname);
      for (const n of ["accounts_email_lower_uq", "notifications_recipient_created_idx", "posts_owner_idx", "media_files_storage_key_uq", "sessions_expires_idx"]) expect(idx).toContain(n);
      const runs = await sql`select tag, status, duration_ms from drizzle.migration_runs`;
      expect(runs).toHaveLength(1);
      expect(runs[0]!.status).toBe("succeeded");
    } finally { await sql.end(); await f.drop(); }
  });

  it("is a no-op the second time", async () => {
    const f = await freshDatabase("mig");
    try {
      await runMigrations({ url: f.url, dir: MIGRATIONS, log: quiet });
      const again = await runMigrations({ url: f.url, dir: MIGRATIONS, log: quiet });
      expect(again.applied).toEqual([]);
      const sql = postgres(f.url, { max: 1 });
      const [{ n }] = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
      expect(n).toBe(1);
      await sql.end();
    } finally { await f.drop(); }
  });

  it("serialises concurrent runners with an advisory lock (each migration runs exactly once)", async () => {
    const f = await freshDatabase("mig");
    try {
      const results = await Promise.all([1, 2, 3].map(() => runMigrations({ url: f.url, dir: MIGRATIONS, log: quiet })));
      expect(results.flatMap((r) => r.applied)).toEqual(["0000_init"]);
      const sql = postgres(f.url, { max: 1 });
      const [{ n }] = await sql`select count(*)::int as n from drizzle.migration_runs where status='succeeded'`;
      expect(n).toBe(1);
      await sql.end();
    } finally { await f.drop(); }
  });

  it("upgrades a database from the previous schema version, preserving data", async () => {
    const f = await freshDatabase("mig");
    const dir = copyMigrations();
    const sql = postgres(f.url, { max: 1, onnotice: quiet });
    try {
      await runMigrations({ url: f.url, dir, log: quiet });
      await sql`insert into accounts (email, password_hash) values ('a@b.co', 'x')`;
      addMigration(dir, "0001_add_phone_verified", `ALTER TABLE "accounts" ADD COLUMN "phone_verified_at" timestamp with time zone;`);
      const r = await runMigrations({ url: f.url, dir, log: quiet });
      expect(r.applied).toEqual(["0001_add_phone_verified"]);
      const [row] = await sql`select email, phone_verified_at from accounts`;
      expect(row).toEqual({ email: "a@b.co", phone_verified_at: null });
    } finally { await sql.end(); await f.drop(); }
  });

  it("rolls back a failing migration, records the failure and blocks the deployment", async () => {
    const f = await freshDatabase("mig");
    const dir = copyMigrations();
    const sql = postgres(f.url, { max: 1, onnotice: quiet });
    try {
      await runMigrations({ url: f.url, dir, log: quiet });
      addMigration(dir, "0001_broken", `CREATE TABLE "half" (id int);--> statement-breakpoint\nSELECT * FROM does_not_exist;`);
      await expect(runMigrations({ url: f.url, dir, log: quiet })).rejects.toThrow(/0001_broken failed and was rolled back/);
      const [{ t }] = await sql`select to_regclass('public.half') as t`;
      expect(t).toBeNull();
      const [run] = await sql`select status, error from drizzle.migration_runs where tag='0001_broken'`;
      expect(run!.status).toBe("failed");
      expect(run!.error).toMatch(/does_not_exist/);
    } finally { await sql.end(); await f.drop(); }
  });

  it("refuses an applied migration whose file was edited", async () => {
    const f = await freshDatabase("mig");
    const dir = copyMigrations();
    try {
      await runMigrations({ url: f.url, dir, log: quiet });
      writeFileSync(join(dir, "0000_init.sql"), readFileSync(join(dir, "0000_init.sql"), "utf8") + "\n-- edited");
      await expect(runMigrations({ url: f.url, dir, log: quiet })).rejects.toThrow(/modified after being applied/);
    } finally { await f.drop(); }
  });

  it("refuses unreviewed destructive SQL", async () => {
    const f = await freshDatabase("mig");
    const dir = copyMigrations();
    try {
      await runMigrations({ url: f.url, dir, log: quiet });
      addMigration(dir, "0001_drop", `ALTER TABLE "accounts" DROP COLUMN "disabled_at";`);
      await expect(runMigrations({ url: f.url, dir, log: quiet })).rejects.toThrow(/destructive/);
      expect(findDestructive("TRUNCATE posts")).not.toHaveLength(0);
      expect(findDestructive("DELETE FROM posts")).not.toHaveLength(0);
      expect(findDestructive("DELETE FROM posts WHERE id = '1'")).toHaveLength(0);
      expect(findDestructive(`ALTER TABLE "a" ADD COLUMN "b" text;`)).toHaveLength(0);
    } finally { await f.drop(); }
  });
});
