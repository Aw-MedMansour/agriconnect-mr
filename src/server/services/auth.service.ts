import { and, eq, gt, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/client.server";
import { accounts, rateLimits, sessions, userRoles } from "../db/schema";
import { AppError, normalizeEmail } from "./policy";
import { PASSWORD_MAX, PASSWORD_MIN, burnPasswordCheck, hashPassword, verifyLegacyBcrypt, verifyPassword } from "../auth/password";
import { hmacHex, randomToken } from "../auth/tokens";

export const SESSION_COOKIE = "ac_session";
export const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;
const SESSION_REFRESH_MS = 24 * 3600 * 1000;

export type SessionUser = { id: string; email: string; isAdmin: boolean };
export type ClientMeta = { ip?: string | null; userAgent?: string | null };

/** Fixed-window counter; throws when the limit is exceeded. */
export async function hitRateLimit(db: Db, key: string, limit: number, windowMs: number) {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const [row] = await db.insert(rateLimits).values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({ target: [rateLimits.key, rateLimits.windowStart], set: { count: sql`${rateLimits.count} + 1` } })
    .returning({ count: rateLimits.count });
  if ((row?.count ?? 0) > limit) throw new AppError("RATE_LIMITED", "Trop de tentatives. Réessayez plus tard.");
}

const sessionId = (secret: string, token: string) => hmacHex(secret, `session:${token}`);

async function createSession(db: Db, secret: string, userId: string, meta: ClientMeta) {
  const token = randomToken(32);
  await db.insert(sessions).values({
    id: await sessionId(secret, token), userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    ip: meta.ip?.slice(0, 64) ?? null, userAgent: meta.userAgent?.slice(0, 300) ?? null,
  });
  return token;
}

function checkPassword(password: unknown): string {
  const p = String(password ?? "");
  if (p.length < PASSWORD_MIN) throw new AppError("INVALID", `Mot de passe invalide : au moins ${PASSWORD_MIN} caractères.`);
  if (p.length > PASSWORD_MAX) throw new AppError("INVALID", "Mot de passe trop long.");
  return p;
}

export async function signUp(db: Db, secret: string, input: { email: unknown; password: unknown }, meta: ClientMeta) {
  const email = normalizeEmail(input.email);
  const password = checkPassword(input.password);
  await hitRateLimit(db, `signup:ip:${meta.ip ?? "unknown"}`, 10, 3600_000);
  const passwordHash = await hashPassword(password);
  const inserted = await db.insert(accounts).values({ email, passwordHash })
    .onConflictDoNothing().returning({ id: accounts.id });
  if (!inserted[0]) throw new AppError("CONFLICT", "already registered");
  const token = await createSession(db, secret, inserted[0].id, meta);
  return { token, user: { id: inserted[0].id, email, isAdmin: false } satisfies SessionUser };
}

export async function signIn(db: Db, secret: string, input: { email: unknown; password: unknown }, meta: ClientMeta) {
  const email = normalizeEmail(input.email);
  const password = String(input.password ?? "").slice(0, PASSWORD_MAX);
  await hitRateLimit(db, `login:ip:${meta.ip ?? "unknown"}`, 30, 15 * 60_000);
  await hitRateLimit(db, `login:email:${email}`, 10, 15 * 60_000);
  const [acc] = await db.select().from(accounts).where(and(sql`lower(${accounts.email}) = ${email}`, isNull(accounts.disabledAt)));
  if (!acc) { await burnPasswordCheck(password); throw new AppError("UNAUTHENTICATED", "Email ou mot de passe incorrect."); }

  let ok = false;
  if (acc.passwordHash) ok = await verifyPassword(password, acc.passwordHash);
  else if (acc.legacyBcryptHash && (await verifyLegacyBcrypt(password, acc.legacyBcryptHash))) {
    ok = true; // upgrade the imported hash to argon2id
    await db.update(accounts).set({ passwordHash: await hashPassword(password), legacyBcryptHash: null, updatedAt: new Date() }).where(eq(accounts.id, acc.id));
  }
  if (!ok) throw new AppError("UNAUTHENTICATED", "Email ou mot de passe incorrect.");
  const token = await createSession(db, secret, acc.id, meta); // new token on every login (rotation)
  return { token, user: { id: acc.id, email: acc.email, isAdmin: await isAdmin(db, acc.id) } satisfies SessionUser };
}

export async function isAdmin(db: Db, userId: string) {
  const r = await db.select({ role: userRoles.role }).from(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin")));
  return r.length > 0;
}

export async function resolveSession(db: Db, secret: string, token: string | undefined | null): Promise<SessionUser | null> {
  if (!token || token.length > 100) return null;
  const id = await sessionId(secret, token);
  const [row] = await db.select({ userId: sessions.userId, lastSeenAt: sessions.lastSeenAt, email: accounts.email })
    .from(sessions).innerJoin(accounts, eq(accounts.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date()), isNull(accounts.disabledAt)));
  if (!row) return null;
  if (Date.now() - row.lastSeenAt.getTime() > SESSION_REFRESH_MS) {
    await db.update(sessions).set({ lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_TTL_MS) }).where(eq(sessions.id, id));
  }
  return { id: row.userId, email: row.email, isAdmin: await isAdmin(db, row.userId) };
}

export async function revokeSession(db: Db, secret: string, token: string | undefined | null) {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.id, await sessionId(secret, token)));
}

export async function purgeExpired(db: Db) {
  await db.delete(sessions).where(sql`${sessions.expiresAt} < now()`);
  await db.delete(rateLimits).where(sql`${rateLimits.windowStart} < now() - interval '1 day'`);
}
