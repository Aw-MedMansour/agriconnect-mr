// Admin tool: grant the admin role. Usage: DATABASE_URL=... bun scripts/grant-admin.ts user@example.com
import { sql } from "drizzle-orm";
import { createDb } from "../src/server/db/client.server";
import { accounts, userRoles } from "../src/server/db/schema";

const email = (process.argv[2] || "").toLowerCase();
const { client, db } = createDb(process.env["DATABASE_URL"]!);
const [acc] = await db
  .select({ id: accounts.id })
  .from(accounts)
  .where(sql`lower(${accounts.email}) = ${email}`);
if (acc) await db.insert(userRoles).values({ userId: acc.id, role: "admin" }).onConflictDoNothing();
console.log(acc ? `admin granted to ${email}` : `no account for ${email}`);
await client.end();
process.exit(acc ? 0 : 1);
