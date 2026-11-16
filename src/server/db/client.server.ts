// Postgres.js pool (driver defaults for pool size) + Drizzle. Created lazily, closed on shutdown.
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { serverEnv } from "../env.server";

export type Db = PostgresJsDatabase<typeof schema>;

let sqlClient: postgres.Sql | undefined;
let db: Db | undefined;

export function createDb(url: string) {
  const client = postgres(url, {
    connect_timeout: 10,        // seconds to establish a connection
    idle_timeout: 30,           // close idle connections after 30 s
    max_lifetime: 60 * 30,      // recycle connections every 30 min
    prepare: true,
    onnotice: () => {},
  });
  return { client, db: drizzle(client, { schema }) };
}

export function getDb(): Db {
  if (!db) {
    const created = createDb(serverEnv().databaseUrl);
    sqlClient = created.client;
    db = created.db;
    const close = () => { void sqlClient?.end({ timeout: 5 }); };
    process.once?.("SIGTERM", close);
    process.once?.("SIGINT", close);
  }
  return db;
}

export async function pingDb(): Promise<boolean> {
  getDb();
  try { await sqlClient!`select 1`; return true; } catch { return false; }
}
