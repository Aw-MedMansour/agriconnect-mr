import postgres from "postgres";
import { createDb } from "../src/server/db/client.server";
import { runMigrations } from "../scripts/migrate-lib";

export const ADMIN_URL = process.env["TEST_DATABASE_URL"] || "postgres://postgres@127.0.0.1:54318/postgres?sslmode=disable";
export const MIGRATIONS = "db/migrations";

const withDb = (url: string, name: string) => { const u = new URL(url); u.pathname = `/${name}`; return u.toString(); };

/** Creates an empty, uniquely named database and returns its URL plus a cleanup function. */
export async function freshDatabase(prefix = "t") {
  const name = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const admin = postgres(ADMIN_URL, { max: 1, onnotice: () => {} });
  await admin.unsafe(`create database "${name}"`);
  const url = withDb(ADMIN_URL, name);
  return {
    url,
    async drop() { await admin.unsafe(`drop database if exists "${name}" with (force)`); await admin.end(); },
  };
}

export async function migratedDb() {
  const fresh = await freshDatabase("app");
  await runMigrations({ url: fresh.url, dir: MIGRATIONS, log: () => {} });
  const { client, db } = createDb(fresh.url);
  return { ...fresh, db, client, async close() { await client.end(); await fresh.drop(); } };
}

export const SECRET = "test-session-secret-0123456789abcdef0123456789";
