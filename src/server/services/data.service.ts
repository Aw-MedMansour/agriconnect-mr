// Server-side replacements for the previous row-level policies and database RPCs.
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../db/client.server";
import { accounts, conversationParticipants, conversations, notifications, posts, products, profiles, services } from "../db/schema";
import {
  AppError, CONTENT_TABLES, OWNER_KEY, UUID_RE, assertDocument, onlyInteractionsChanged, omitKeys,
  publicProfile, sameJson, stripContact, validateNotification, type ContentTable,
} from "./policy";
import type { SessionUser } from "./auth.service";

const TABLES = { posts, products, services } as const;
type Doc = Record<string, unknown>;

const need = (actor: SessionUser | null): SessionUser => {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Authentification requise.");
  return actor;
};
const contentTable = (t: unknown): ContentTable => {
  if (!CONTENT_TABLES.includes(t as ContentTable)) throw new AppError("INVALID", "Table non autorisée.");
  return t as ContentTable;
};
const cleanId = (id: unknown) => {
  const s = String(id ?? "");
  if (!s || s.length > 200) throw new AppError("INVALID", "Identifiant invalide.");
  return s;
};

// ── Profiles ──────────────────────────────────────────────────────────────────
/** Directory of members: whitelisted fields only, members only (as before). */
export async function listPublicProfiles(db: Db, actor: SessionUser | null) {
  if (!actor) return [];
  const rows = await db.select({ data: profiles.data }).from(profiles).orderBy(desc(profiles.createdAt));
  return rows.map((r) => publicProfile(r.data));
}

export async function getOwnProfile(db: Db, actor: SessionUser | null) {
  const me = need(actor);
  const [row] = await db.select({ data: profiles.data }).from(profiles).where(eq(profiles.id, me.id));
  return row?.data ?? null;
}

export async function saveOwnProfile(db: Db, actor: SessionUser | null, id: unknown, data: unknown) {
  const me = need(actor);
  if (String(id) !== me.id) throw new AppError("FORBIDDEN", "Vous ne pouvez modifier que votre profil.");
  const doc = { ...omitKeys(assertDocument(data), ["password"]), id: me.id };
  await db.insert(profiles).values({ id: me.id, data: doc })
    .onConflictDoUpdate({ target: profiles.id, set: { data: doc, updatedAt: new Date() } });
}

// ── Products / services / posts ───────────────────────────────────────────────
export async function listContent(db: Db, table: ContentTable) {
  const t = TABLES[contentTable(table)];
  const rows = await db.select({ data: t.data }).from(t).orderBy(desc(t.createdAt));
  return rows.map((r) => r.data);
}

export async function upsertContent(db: Db, actor: SessionUser | null, table: unknown, id: unknown, data: unknown) {
  const me = need(actor);
  const name = contentTable(table);
  const t = TABLES[name];
  const key = cleanId(id);
  const doc = stripContact(assertDocument(data));
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(t).where(eq(t.id, key)).for("update");
    const ownerField = OWNER_KEY[name];
    if (!existing) {
      if (String(doc[ownerField]) !== me.id) throw new AppError("FORBIDDEN", "Vous ne pouvez publier qu'en votre nom.");
      await tx.insert(t).values({ id: key, ownerId: me.id, data: doc });
      return;
    }
    const isOwner = existing.ownerId === me.id;
    if (isOwner) {
      if (String(doc[ownerField]) !== me.id) throw new AppError("FORBIDDEN", "Le propriétaire ne peut pas être changé.");
    } else if (!onlyInteractionsChanged(existing.data, doc)) {
      throw new AppError("FORBIDDEN", "Seules les interactions peuvent être modifiées.");
    }
    await tx.update(t).set({ data: doc, updatedAt: new Date() }).where(eq(t.id, key));
  });
}

export async function deleteContent(db: Db, actor: SessionUser | null, table: unknown, id: unknown) {
  const me = need(actor);
  const t = TABLES[contentTable(table)];
  const key = cleanId(id);
  const [row] = await db.select({ ownerId: t.ownerId }).from(t).where(eq(t.id, key));
  if (!row) return;
  if (row.ownerId !== me.id && !me.isAdmin) throw new AppError("FORBIDDEN", "Suppression réservée à l'auteur.");
  await db.delete(t).where(eq(t.id, key));
}

/** Public view counter (atomic increment, no read-modify-write race). */
export async function registerView(db: Db, table: unknown, id: unknown) {
  const t = TABLES[contentTable(table)];
  await db.update(t)
    .set({ data: sql`jsonb_set(${t.data}, '{viewsCount}', to_jsonb(COALESCE((${t.data}->>'viewsCount')::int, 0) + 1), true)` })
    .where(eq(t.id, cleanId(id)));
}

// ── Conversations ─────────────────────────────────────────────────────────────
const participantIds = (d: Doc) => (Array.isArray(d["participantIds"]) ? (d["participantIds"] as unknown[]).map(String) : []);

export async function listConversations(db: Db, actor: SessionUser | null) {
  if (!actor) return [];
  const rows = await db.select({ data: conversations.data }).from(conversations)
    .innerJoin(conversationParticipants, eq(conversationParticipants.conversationId, conversations.id))
    .where(eq(conversationParticipants.userId, actor.id)).orderBy(desc(conversations.createdAt));
  return rows.map((r) => r.data);
}

export async function upsertConversation(db: Db, actor: SessionUser | null, id: unknown, data: unknown) {
  const me = need(actor);
  const key = cleanId(id);
  const doc = assertDocument(data);
  const ids = participantIds(doc);
  if (!ids.includes(me.id)) throw new AppError("FORBIDDEN", "Vous devez participer à la conversation.");
  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(conversations).where(eq(conversations.id, key)).for("update");
    if (existing) {
      const member = await tx.select().from(conversationParticipants)
        .where(and(eq(conversationParticipants.conversationId, key), eq(conversationParticipants.userId, me.id)));
      if (!member.length) throw new AppError("FORBIDDEN", "Conversation inaccessible.");
      if (!sameJson([...participantIds(existing.data)].sort(), [...ids].sort())) throw new AppError("FORBIDDEN", "Les participants ne peuvent pas changer.");
      await tx.update(conversations).set({ data: doc, updatedAt: new Date() }).where(eq(conversations.id, key));
      return;
    }
    await tx.insert(conversations).values({ id: key, data: doc });
    const real = ids.filter((x) => UUID_RE.test(x));
    const known = real.length ? await tx.select({ id: accounts.id }).from(accounts).where(inArray(accounts.id, real)) : [];
    if (known.length) await tx.insert(conversationParticipants).values(known.map((k) => ({ conversationId: key, userId: k.id }))).onConflictDoNothing();
  });
}

export async function deleteConversation(db: Db, actor: SessionUser | null, id: unknown) {
  const me = need(actor);
  const key = cleanId(id);
  const member = await db.select().from(conversationParticipants)
    .where(and(eq(conversationParticipants.conversationId, key), eq(conversationParticipants.userId, me.id)));
  if (!member.length) throw new AppError("FORBIDDEN", "Conversation inaccessible.");
  await db.delete(conversations).where(eq(conversations.id, key));
}

// ── Notifications ─────────────────────────────────────────────────────────────
export async function listNotifications(db: Db, actor: SessionUser | null) {
  if (!actor) return [];
  const rows = await db.select().from(notifications).where(eq(notifications.recipientId, actor.id))
    .orderBy(desc(notifications.createdAt)).limit(200);
  return rows.map((r) => ({ ...r.data, id: r.id, read: r.read }));
}

export async function createNotification(db: Db, actor: SessionUser | null, id: unknown, data: unknown) {
  const me = need(actor);
  const key = cleanId(id);
  const doc = assertDocument(data);
  validateNotification(key, doc, me.id);
  await db.transaction(async (tx) => {
    // Serialise per actor so the 30/minute limit cannot be raced.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"notif:" + me.id}))`);
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(notifications)
      .where(and(eq(notifications.actorId, me.id), sql`${notifications.createdAt} > now() - interval '1 minute'`));
    if (n >= 30) throw new AppError("RATE_LIMITED", "Trop de notifications envoyées, réessayez dans un instant.");
    const [recipient] = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, String(doc["recipientId"])));
    if (!recipient) return; // recipient without an account (demo member): silently ignored
    await tx.insert(notifications).values({ id: key, recipientId: recipient.id, actorId: me.id, type: String(doc["type"]), read: false, data: { ...doc, read: false } })
      .onConflictDoNothing();
  });
}

/** Only the recipient may change only the read flag. */
export async function updateNotification(db: Db, actor: SessionUser | null, id: unknown, data: unknown) {
  const me = need(actor);
  const key = cleanId(id);
  const doc = assertDocument(data);
  const [row] = await db.select().from(notifications).where(eq(notifications.id, key));
  if (!row || row.recipientId !== me.id) throw new AppError("NOT_FOUND", "Notification introuvable.");
  if (!sameJson(omitKeys(row.data, ["read", "id"]), omitKeys(doc, ["read", "id"]))) throw new AppError("FORBIDDEN", "Seul le statut de lecture peut être modifié.");
  const read = doc["read"] === true;
  await db.update(notifications).set({ read, data: { ...row.data, read } }).where(eq(notifications.id, key));
}

export async function deleteNotification(db: Db, actor: SessionUser | null, id: unknown) {
  const me = need(actor);
  await db.delete(notifications).where(and(eq(notifications.id, cleanId(id)), eq(notifications.recipientId, me.id)));
}
