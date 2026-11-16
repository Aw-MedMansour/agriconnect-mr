// Admin tool: set a member's password (e.g. imported accounts flagged "password reset required").
// Usage: DATABASE_URL=... bun scripts/set-password.ts user@example.com   (password read from NEW_PASSWORD)
import { sql } from "drizzle-orm";
import { createDb } from "../src/server/db/client.server";
import { accounts, sessions } from "../src/server/db/schema";
import { hashPassword, PASSWORD_MIN } from "../src/server/auth/password";

const email = (process.argv[2] || "").toLowerCase();
const password = process.env["NEW_PASSWORD"] || "";
if (!email || password.length < PASSWORD_MIN) { console.error(`usage: NEW_PASSWORD=<min ${PASSWORD_MIN} chars> bun scripts/set-password.ts <email>`); process.exit(1); }
const { client, db } = createDb(process.env["DATABASE_URL"]!);
const res = await db.update(accounts).set({ passwordHash: await hashPassword(password), legacyBcryptHash: null, updatedAt: new Date() })
  .where(sql`lower(${accounts.email}) = ${email}`).returning({ id: accounts.id });
if (res[0]) await db.delete(sessions).where(sql`${sessions.userId} = ${res[0].id}`);
console.log(res[0] ? `password updated, sessions revoked for ${email}` : `no account for ${email}`);
await client.end();
process.exit(res[0] ? 0 : 1);
