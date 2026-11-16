// OPTIONAL one-time tool: copies data and media from the old hosted database into PostgreSQL 18.
// Run explicitly by an administrator; nothing at runtime depends on the old system. Safe to retry
// (existing rows/files are skipped). The old data is never modified or deleted.
//
// Env: SOURCE_DATABASE_URL (old database, read-only use), DATABASE_URL (new database),
//      SOURCE_STORAGE_URL + SOURCE_SERVICE_KEY (to download media; optional), MEDIA_DIR, MEDIA_SIGNING_SECRET
// Usage: bun scripts/supabase-import/import.ts [--dry-run] [--report=import-report.json]
import { writeFileSync } from "node:fs";
import postgres from "postgres";
import { eq, sql as dsql } from "drizzle-orm";
import { createDb } from "../../src/server/db/client.server";
import * as s from "../../src/server/db/schema";
import { OWNER_KEY, UUID_RE, stripContact } from "../../src/server/services/policy";
import { detectMime, storeMedia } from "../../src/server/media/media.service";

const env = (k: string, required = true) => {
  const v = process.env[k];
  if (required && !v) {
    console.error(`Missing ${k}`);
    process.exit(1);
  }
  return v ?? "";
};
const dryRun = process.argv.includes("--dry-run");
const reportPath =
  process.argv.find((a) => a.startsWith("--report="))?.split("=")[1] ||
  `import-report-${Date.now()}.json`;
const BUCKET = "agroconnect-media";

type Doc = Record<string, unknown>;
const report = {
  startedAt: new Date().toISOString(),
  dryRun,
  counts: {} as Record<
    string,
    { source: number; imported: number; skipped: number; failed: number }
  >,
  failures: [] as { table: string; id: string; reason: string }[],
  passwordResetRequired: [] as string[],
  media: { source: 0, imported: 0, skipped: 0, failed: 0, checksumVerified: 0 },
  unresolvedUrls: 0,
};
const bump = (t: string, k: "source" | "imported" | "skipped" | "failed") => {
  (report.counts[t] ??= { source: 0, imported: 0, skipped: 0, failed: 0 })[k]++;
};
const fail = (table: string, id: string, reason: string) => {
  bump(table, "failed");
  report.failures.push({ table, id, reason });
};

const src = postgres(env("SOURCE_DATABASE_URL"), { max: 2, onnotice: () => {} });
const { client: dst, db } = createDb(env("DATABASE_URL"));

// ── 1. Media first, so documents can be rewritten to the new URLs ────────────
const urlMap = new Map<string, string>(); // legacy object path → new signed URL
async function importMedia() {
  const storageUrl = env("SOURCE_STORAGE_URL", false);
  const key = env("SOURCE_SERVICE_KEY", false);
  const objects = await src<
    { name: string }[]
  >`select name from storage.objects where bucket_id = ${BUCKET} order by created_at`.catch(
    () => [],
  );
  report.media.source = objects.length;
  for (const o of objects) {
    const existing = await db
      .select()
      .from(s.mediaFiles)
      .where(eq(s.mediaFiles.legacyPath, o.name));
    if (existing[0]) {
      const { signMediaUrl } = await import("../../src/server/media/media.service");
      urlMap.set(o.name, await signMediaUrl(env("MEDIA_SIGNING_SECRET"), existing[0].id));
      report.media.skipped++;
      continue;
    }
    if (!storageUrl || !key) {
      report.media.failed++;
      report.failures.push({
        table: "media",
        id: o.name,
        reason: "SOURCE_STORAGE_URL/SOURCE_SERVICE_KEY not set",
      });
      continue;
    }
    try {
      const res = await fetch(
        `${storageUrl.replace(/\/$/, "")}/storage/v1/object/${BUCKET}/${o.name.split("/").map(encodeURIComponent).join("/")}`,
        { headers: { authorization: `Bearer ${key}`, apikey: key } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const mime = detectMime(bytes);
      if (!mime) throw new Error("unsupported or corrupt file");
      if (dryRun) {
        report.media.imported++;
        continue;
      }
      const stored = await storeMedia(
        db,
        { mediaDir: env("MEDIA_DIR"), signingSecret: env("MEDIA_SIGNING_SECRET") },
        null,
        { bytes, type: mime, name: o.name },
        o.name,
      );
      const [row] = await db.select().from(s.mediaFiles).where(eq(s.mediaFiles.id, stored.id));
      const { sha256Hex } = await import("../../src/server/auth/tokens");
      if (row?.sha256 === (await sha256Hex(bytes)) && row.sizeBytes === bytes.length)
        report.media.checksumVerified++;
      urlMap.set(o.name, stored.url);
      report.media.imported++;
    } catch (e) {
      report.media.failed++;
      report.failures.push({ table: "media", id: o.name, reason: (e as Error).message });
    }
  }
}

const LEGACY_URL =
  /https?:\/\/[^"'\s]+\/storage\/v1\/object\/(?:sign|public)\/agroconnect-media\/([^"'\s?]+)(?:\?[^"'\s]*)?/g;
function rewrite(doc: Doc): Doc {
  const text = JSON.stringify(doc).replace(LEGACY_URL, (full, path: string) => {
    const mapped = urlMap.get(decodeURIComponent(path));
    if (!mapped) {
      report.unresolvedUrls++;
      return full;
    }
    return mapped;
  });
  return JSON.parse(text);
}

// ── 2. Accounts (password hashes verified at next login, otherwise reset required) ─
async function importAccounts() {
  const users = await src<
    { id: string; email: string | null; encrypted_password: string | null; created_at: Date }[]
  >`
    select id::text, email, encrypted_password, created_at from auth.users order by created_at`;
  for (const u of users) {
    bump("accounts", "source");
    if (!u.email) {
      fail("accounts", u.id, "no email");
      continue;
    }
    const email = u.email.trim().toLowerCase();
    const clash = await db
      .select({ id: s.accounts.id })
      .from(s.accounts)
      .where(dsql`lower(${s.accounts.email}) = ${email}`);
    if (clash[0] && clash[0].id !== u.id) {
      fail("accounts", u.id, `duplicate email ${email}`);
      continue;
    }
    if (clash[0]) {
      bump("accounts", "skipped");
      continue;
    }
    const bcryptOk = !!u.encrypted_password && /^\$2[aby]\$\d{2}\$/.test(u.encrypted_password);
    if (!bcryptOk) report.passwordResetRequired.push(email);
    if (dryRun) {
      bump("accounts", "imported");
      continue;
    }
    await db.insert(s.accounts).values({
      id: u.id,
      email,
      createdAt: u.created_at,
      updatedAt: u.created_at,
      legacyBcryptHash: bcryptOk ? u.encrypted_password : null,
      passwordHash: bcryptOk ? null : "!reset-required", // never verifies: set with scripts/set-password.ts
    });
    bump("accounts", "imported");
  }
}

async function accountIds() {
  return new Set((await db.select({ id: s.accounts.id }).from(s.accounts)).map((r) => r.id));
}

async function importDocs(
  table: string,
  run: (row: { id: string; data: Doc; created_at: Date }, ids: Set<string>) => Promise<boolean>,
) {
  const rows = await src<
    { id: string; data: Doc; created_at: Date }[]
  >`select id::text, data, created_at from ${src("public")}.${src(table)} order by created_at`.catch(
    () => [],
  );
  const ids = await accountIds();
  for (const r of rows) {
    bump(table, "source");
    try {
      const imported = await run({ ...r, data: rewrite(r.data) }, ids);
      bump(table, imported ? "imported" : "skipped");
    } catch (e) {
      fail(table, r.id, (e as Error).message);
    }
  }
}

async function main() {
  console.log(`[import] starting${dryRun ? " (dry run)" : ""}`);
  await importMedia();
  await importAccounts();
  const W = !dryRun;

  await importDocs("users", async (r, ids) => {
    if (!ids.has(r.id)) throw new Error("no matching account");
    if (!W) return true;
    const res = await db
      .insert(s.profiles)
      .values({ id: r.id, data: { ...r.data, id: r.id }, createdAt: r.created_at })
      .onConflictDoNothing()
      .returning({ id: s.profiles.id });
    return res.length > 0;
  });

  for (const table of ["products", "services", "posts"] as const) {
    await importDocs(table, async (r, ids) => {
      const owner = String(r.data[OWNER_KEY[table]] ?? "");
      if (!W) return true;
      const res = await db
        .insert(s[table])
        .values({
          id: r.id,
          ownerId: ids.has(owner) ? owner : null,
          data: stripContact(r.data),
          createdAt: r.created_at,
          updatedAt: r.created_at,
        })
        .onConflictDoNothing()
        .returning({ id: s[table].id });
      return res.length > 0;
    });
  }

  await importDocs("conversations", async (r, ids) => {
    if (!W) return true;
    return db.transaction(async (tx) => {
      const res = await tx
        .insert(s.conversations)
        .values({ id: r.id, data: r.data, createdAt: r.created_at })
        .onConflictDoNothing()
        .returning({ id: s.conversations.id });
      const members = (
        Array.isArray(r.data["participantIds"])
          ? (r.data["participantIds"] as unknown[]).map(String)
          : []
      ).filter((x) => ids.has(x));
      if (members.length)
        await tx
          .insert(s.conversationParticipants)
          .values(members.map((userId) => ({ conversationId: r.id, userId })))
          .onConflictDoNothing();
      return res.length > 0;
    });
  });

  await importDocs("notifications", async (r, ids) => {
    const recipient = String(r.data["recipientId"] ?? "");
    if (!ids.has(recipient)) throw new Error("recipient has no account");
    const actor = String(r.data["actorId"] ?? "");
    if (!W) return true;
    const res = await db
      .insert(s.notifications)
      .values({
        id: r.id,
        recipientId: recipient,
        actorId: UUID_RE.test(actor) && ids.has(actor) ? actor : null,
        type: String(r.data["type"] ?? "message"),
        read: r.data["read"] === true,
        data: r.data,
        createdAt: r.created_at,
      })
      .onConflictDoNothing()
      .returning({ id: s.notifications.id });
    return res.length > 0;
  });

  // Verification: every source row is now present (imported now or previously).
  for (const [table, c] of Object.entries(report.counts)) {
    if (c.source !== c.imported + c.skipped + c.failed)
      console.warn(`[import] count mismatch for ${table}`);
  }
  (report as Doc)["finishedAt"] = new Date().toISOString();
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[import] report written to ${reportPath}`);
  console.table(report.counts);
  console.log(
    `[import] media`,
    report.media,
    `unresolved legacy URLs: ${report.unresolvedUrls}`,
    `password resets required: ${report.passwordResetRequired.length}`,
  );
}

main()
  .then(async () => {
    await src.end();
    await dst.end();
    process.exit(report.failures.length ? 2 : 0);
  })
  .catch(async (e) => {
    console.error("[import] FAILED", e);
    await src.end();
    await dst.end();
    process.exit(1);
  });
