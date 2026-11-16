// Controlled migration runner for the self-hosted PostgreSQL database.
// - Compatible with Drizzle's tracking table (drizzle.__drizzle_migrations: hash + created_at)
// - Extra audit log (drizzle.migration_runs: status, duration, error, host)
// - Session advisory lock: only one runner at a time, even with several replicas
// - Refuses edited applied migrations, out-of-order files and unreviewed destructive SQL
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hostname } from "node:os";
import postgres from "postgres";

export const LOCK_KEY = 72_610_001; // arbitrary constant shared by every runner
export const ALLOW_DESTRUCTIVE_MARKER = "-- migrate:allow-destructive";

export type Migration = {
  idx: number;
  tag: string;
  when: number;
  sql: string;
  hash: string;
  statements: string[];
};
export type Log = (msg: string) => void;

const DESTRUCTIVE = [
  /\bdrop\s+(table|schema|database|column|type|domain|extension|index|view|materialized\s+view|function|trigger|policy|owned)\b/i,
  /\btruncate\b/i,
  /\balter\s+table\b[^;]*\bdrop\b/i,
  /\balter\s+table\b[^;]*\balter\s+column\b[^;]*\btype\b/i,
  /\brename\s+(to|column)\b/i,
  /\bdelete\s+from\b(?![^;]*\bwhere\b)/i,
];

export function findDestructive(sqlText: string): string[] {
  const code = sqlText.replace(/--.*$/gm, "");
  return DESTRUCTIVE.filter((re) => re.test(code)).map((re) => re.source);
}

export function loadMigrations(dir: string): Migration[] {
  const journal = JSON.parse(readFileSync(join(dir, "meta", "_journal.json"), "utf8")) as {
    entries: { idx: number; tag: string; when: number }[];
  };
  return journal.entries.map((e) => {
    const sql = readFileSync(join(dir, `${e.tag}.sql`), "utf8");
    return {
      ...e,
      sql,
      hash: createHash("sha256").update(sql).digest("hex"),
      statements: sql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  });
}

export async function waitForDatabase(url: string, log: Log, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  for (let attempt = 1; ; attempt++) {
    const sql = postgres(url, { max: 1, connect_timeout: 5, onnotice: () => {} });
    try {
      await sql`select 1`;
      await sql.end();
      return;
    } catch (e) {
      await sql.end({ timeout: 1 }).catch(() => {});
      if (Date.now() > deadline) throw new Error(`Database not reachable: ${(e as Error).message}`);
      log(`[migrate] waiting for database (attempt ${attempt})…`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

export type RunResult = { applied: string[]; pending: string[]; skipped: number };

export async function runMigrations(opts: {
  url: string;
  dir: string;
  log?: Log;
  dryRun?: boolean;
  lockTimeoutMs?: number;
}): Promise<RunResult> {
  const log = opts.log ?? console.log;
  const migrations = loadMigrations(opts.dir);
  const sql = postgres(opts.url, { max: 1, onnotice: () => {} });
  const applied: string[] = [];
  try {
    const timeout = opts.lockTimeoutMs ?? 10 * 60_000;
    const started = Date.now();
    while (!(await sql`select pg_try_advisory_lock(${LOCK_KEY}) as ok`)[0]!.ok) {
      if (Date.now() - started > timeout)
        throw new Error("Timed out waiting for the migration lock (another runner is active).");
      log("[migrate] another runner holds the lock, waiting…");
      await new Promise((r) => setTimeout(r, 1000));
    }

    await sql`create schema if not exists drizzle`;
    await sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`;
    await sql`create table if not exists drizzle.migration_runs (
      id bigserial primary key, tag text not null, hash text not null, status text not null check (status in ('running','succeeded','failed')),
      started_at timestamptz not null default now(), finished_at timestamptz, duration_ms integer, error text, runner text)`;

    const done = await sql<
      { hash: string; created_at: string }[]
    >`select hash, created_at from drizzle.__drizzle_migrations order by created_at`;
    const doneHashes = new Set(done.map((d) => d.hash));
    const doneWhen = new Set(done.map((d) => Number(d.created_at)));
    const lastWhen = done.length ? Math.max(...done.map((d) => Number(d.created_at))) : 0;

    // An applied migration whose file changed is a hard error: never edit applied migrations.
    for (const m of migrations) {
      if (doneWhen.has(m.when) && !doneHashes.has(m.hash))
        throw new Error(
          `Applied migration ${m.tag} was modified after being applied. Restore the original file and add a new migration.`,
        );
    }
    const pending = migrations.filter((m) => !doneHashes.has(m.hash));
    for (const m of pending) {
      if (m.when <= lastWhen)
        throw new Error(
          `Migration ${m.tag} is older than the last applied migration (out of order). Regenerate it.`,
        );
      const hits = findDestructive(m.sql);
      if (hits.length && !m.sql.includes(ALLOW_DESTRUCTIVE_MARKER)) {
        throw new Error(
          `Migration ${m.tag} contains potentially destructive SQL (${hits.join(", ")}). Review it, follow expand-and-contract, and add "${ALLOW_DESTRUCTIVE_MARKER}" only after approval and a verified backup.`,
        );
      }
    }
    if (!pending.length) {
      log("[migrate] database is up to date.");
      return { applied, pending: [], skipped: migrations.length };
    }
    log(`[migrate] pending: ${pending.map((m) => m.tag).join(", ")}`);
    if (opts.dryRun)
      return {
        applied,
        pending: pending.map((m) => m.tag),
        skipped: migrations.length - pending.length,
      };

    for (const m of pending) {
      const t0 = Date.now();
      const [run] = await sql<
        { id: string }[]
      >`insert into drizzle.migration_runs (tag, hash, status, runner) values (${m.tag}, ${m.hash}, 'running', ${hostname()}) returning id`;
      try {
        await sql.begin(async (tx) => {
          for (const stmt of m.statements) await tx.unsafe(stmt);
          await tx`insert into drizzle.__drizzle_migrations (hash, created_at) values (${m.hash}, ${m.when})`;
        });
        const ms = Date.now() - t0;
        await sql`update drizzle.migration_runs set status='succeeded', finished_at=now(), duration_ms=${ms} where id=${run!.id}`;
        log(`[migrate] applied ${m.tag} in ${ms} ms`);
        applied.push(m.tag);
      } catch (e) {
        const msg = (e as Error).message;
        await sql`update drizzle.migration_runs set status='failed', finished_at=now(), duration_ms=${Date.now() - t0}, error=${msg.slice(0, 4000)} where id=${run!.id}`;
        throw new Error(`Migration ${m.tag} failed and was rolled back: ${msg}`);
      }
    }

    const invalid =
      await sql`select conrelid::regclass::text as tbl, conname from pg_constraint where not convalidated`;
    if (invalid.length)
      log(
        `[migrate] warning: ${invalid.length} constraint(s) still NOT VALID: ${invalid.map((r) => `${r.tbl}.${r.conname}`).join(", ")}`,
      );
    return { applied, pending: [], skipped: migrations.length - applied.length };
  } finally {
    await sql`select pg_advisory_unlock_all()`.catch(() => {});
    await sql.end({ timeout: 5 });
  }
}
