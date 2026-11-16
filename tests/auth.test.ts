import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { migratedDb, SECRET } from "./helpers";
import { resolveSession, revokeSession, signIn, signUp } from "../src/server/services/auth.service";
import { accounts, sessions } from "../src/server/db/schema";

let t: Awaited<ReturnType<typeof migratedDb>>;
const meta = { ip: "10.0.0.1", userAgent: "vitest" };
beforeAll(async () => {
  t = await migratedDb();
});
afterAll(async () => {
  await t.close();
});

describe("native authentication", () => {
  it("registers with an argon2id hash and opens a session", async () => {
    const { token, user } = await signUp(
      t.db,
      SECRET,
      { email: " Awa@Example.com ", password: "correct-horse-1" },
      meta,
    );
    expect(user.email).toBe("awa@example.com");
    const [acc] = await t.db.select().from(accounts);
    expect(acc!.passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect((await resolveSession(t.db, SECRET, token))?.id).toBe(user.id);
    const [s] = await t.db.select().from(sessions);
    expect(s!.id).not.toContain(token); // only a keyed hash of the token is stored
  });

  it("rejects a duplicate email regardless of case", async () => {
    await expect(
      signUp(t.db, SECRET, { email: "AWA@example.com", password: "another-pass-1" }, meta),
    ).rejects.toThrow(/already/);
  });

  it("rejects short passwords", async () => {
    await expect(
      signUp(t.db, SECRET, { email: "x@example.com", password: "short" }, meta),
    ).rejects.toThrow(/8 caractères/);
  });

  it("logs in with the right password only and rotates the session token", async () => {
    await expect(
      signIn(
        t.db,
        SECRET,
        { email: "awa@example.com", password: "wrong-password" },
        { ip: "10.0.0.2" },
      ),
    ).rejects.toThrow(/incorrect/);
    const a = await signIn(
      t.db,
      SECRET,
      { email: "awa@example.com", password: "correct-horse-1" },
      { ip: "10.0.0.2" },
    );
    const b = await signIn(
      t.db,
      SECRET,
      { email: "awa@example.com", password: "correct-horse-1" },
      { ip: "10.0.0.2" },
    );
    expect(a.token).not.toBe(b.token);
  });

  it("revokes a session on logout and ignores expired sessions", async () => {
    const { token } = await signIn(
      t.db,
      SECRET,
      { email: "awa@example.com", password: "correct-horse-1" },
      { ip: "10.0.0.3" },
    );
    await revokeSession(t.db, SECRET, token);
    expect(await resolveSession(t.db, SECRET, token)).toBeNull();
    const { token: t2 } = await signIn(
      t.db,
      SECRET,
      { email: "awa@example.com", password: "correct-horse-1" },
      { ip: "10.0.0.3" },
    );
    await t.db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await resolveSession(t.db, SECRET, t2)).toBeNull();
    expect(await resolveSession(t.db, SECRET, "forged-token")).toBeNull();
  });

  it("limits login attempts per email to 10 per 15 minutes", async () => {
    await signUp(
      t.db,
      SECRET,
      { email: "rl@example.com", password: "rate-limit-pass" },
      { ip: "10.9.9.9" },
    );
    for (let i = 0; i < 10; i++)
      await signIn(
        t.db,
        SECRET,
        { email: "rl@example.com", password: "bad-password" },
        { ip: `10.1.1.${i}` },
      ).catch(() => {});
    await expect(
      signIn(
        t.db,
        SECRET,
        { email: "rl@example.com", password: "rate-limit-pass" },
        { ip: "10.1.2.1" },
      ),
    ).rejects.toThrow(/Trop de tentatives/);
  });

  it("limits sign-ups to 10 per hour per IP", async () => {
    for (let i = 0; i < 10; i++)
      await signUp(
        t.db,
        SECRET,
        { email: `s${i}@example.com`, password: "signup-pass-1" },
        { ip: "10.5.5.5" },
      );
    await expect(
      signUp(
        t.db,
        SECRET,
        { email: "s99@example.com", password: "signup-pass-1" },
        { ip: "10.5.5.5" },
      ),
    ).rejects.toThrow(/Trop de tentatives/);
  });

  it("accepts an imported bcrypt hash once, then upgrades it to argon2id", async () => {
    await t.db
      .insert(accounts)
      .values({
        email: "legacy@example.com",
        legacyBcryptHash: bcrypt.hashSync("old-password-1", 10),
      });
    await signIn(
      t.db,
      SECRET,
      { email: "legacy@example.com", password: "old-password-1" },
      { ip: "10.7.0.1" },
    );
    const [acc] = await t.db
      .select()
      .from(accounts)
      .where(sql`email = 'legacy@example.com'`);
    expect(acc!.legacyBcryptHash).toBeNull();
    expect(acc!.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("never verifies the reset-required placeholder of imported accounts", async () => {
    await t.db
      .insert(accounts)
      .values({ email: "reset@example.com", passwordHash: "!reset-required" });
    await expect(
      signIn(
        t.db,
        SECRET,
        { email: "reset@example.com", password: "!reset-required" },
        { ip: "10.7.0.2" },
      ),
    ).rejects.toThrow(/incorrect/);
  });
});
