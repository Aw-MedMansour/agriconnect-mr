import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migratedDb, SECRET } from "./helpers";
import { signUp, type SessionUser } from "../src/server/services/auth.service";
import * as svc from "../src/server/services/data.service";
import { posts, userRoles } from "../src/server/db/schema";

let t: Awaited<ReturnType<typeof migratedDb>>;
let alice: SessionUser, bob: SessionUser, carol: SessionUser;
const mk = async (email: string) => (await signUp(t.db, SECRET, { email, password: "password-123" }, { ip: email })).user;

beforeAll(async () => {
  t = await migratedDb();
  alice = await mk("alice@example.com"); bob = await mk("bob@example.com"); carol = await mk("carol@example.com");
});
afterAll(async () => { await t.close(); });

describe("profiles", () => {
  it("lets members edit only their own profile and hides contact fields from others", async () => {
    await svc.saveOwnProfile(t.db, alice, alice.id, { id: alice.id, name: "Alice", email: "alice@example.com", phone: "+222", password: "x", location: "Rosso" });
    await expect(svc.saveOwnProfile(t.db, bob, alice.id, { name: "hacked" })).rejects.toThrow(/votre profil/);
    const own = await svc.getOwnProfile(t.db, alice);
    expect(own).toMatchObject({ name: "Alice", phone: "+222" });
    expect(own).not.toHaveProperty("password");
    const dir = await svc.listPublicProfiles(t.db, bob);
    expect(dir).toEqual([{ id: alice.id, name: "Alice", location: "Rosso" }]);
    expect(await svc.listPublicProfiles(t.db, null)).toEqual([]);
  });
});

describe("content ownership", () => {
  it("only lets a member publish in their own name and strips contact details", async () => {
    await expect(svc.upsertContent(t.db, bob, "posts", "p1", { id: "p1", authorId: alice.id, content: "x" })).rejects.toThrow(/votre nom/);
    await svc.upsertContent(t.db, alice, "posts", "p1", { id: "p1", authorId: alice.id, content: "Récolte", authorPhone: "+222", likesCount: 0 });
    const [row] = await t.db.select().from(posts);
    expect(row!.ownerId).toBe(alice.id);
    expect(row!.data).not.toHaveProperty("authorPhone");
  });

  it("lets others change interaction counters but nothing else", async () => {
    await svc.upsertContent(t.db, bob, "posts", "p1", { id: "p1", authorId: alice.id, content: "Récolte", likesCount: 1, likedBy: [bob.id] });
    await expect(svc.upsertContent(t.db, bob, "posts", "p1", { id: "p1", authorId: alice.id, content: "Edited by Bob", likesCount: 1 })).rejects.toThrow(/interactions/);
    await expect(svc.upsertContent(t.db, null, "posts", "p1", { id: "p1" })).rejects.toThrow(/Authentification/);
  });

  it("prevents the owner from transferring ownership", async () => {
    await expect(svc.upsertContent(t.db, alice, "posts", "p1", { id: "p1", authorId: bob.id })).rejects.toThrow(/propriétaire/);
  });

  it("restricts deletion to the author or an admin", async () => {
    await expect(svc.deleteContent(t.db, bob, "posts", "p1")).rejects.toThrow(/auteur/);
    await t.db.insert(userRoles).values({ userId: carol.id, role: "admin" });
    await svc.deleteContent(t.db, { ...carol, isAdmin: true }, "posts", "p1");
    expect(await svc.listContent(t.db, "posts")).toEqual([]);
  });

  it("counts views atomically for visitors", async () => {
    await svc.upsertContent(t.db, alice, "products", "pr1", { id: "pr1", sellerId: alice.id, name: "Dattes", unit: "kg" });
    await Promise.all(Array.from({ length: 20 }, () => svc.registerView(t.db, "products", "pr1")));
    const [p] = await svc.listContent(t.db, "products");
    expect(p!["viewsCount"]).toBe(20);
  });

  it("rejects unknown tables", async () => {
    await expect(svc.upsertContent(t.db, alice, "accounts", "x", {})).rejects.toThrow(/Table non autorisée/);
  });
});

describe("conversations", () => {
  const conv = () => ({ id: "c1", participantIds: [alice.id, bob.id], messages: [{ senderId: alice.id, text: "Salut", ts: 1 }] });

  it("is visible only to participants", async () => {
    await expect(svc.upsertConversation(t.db, carol, "c1", conv())).rejects.toThrow(/participer/);
    await svc.upsertConversation(t.db, alice, "c1", conv());
    expect(await svc.listConversations(t.db, bob)).toHaveLength(1);
    expect(await svc.listConversations(t.db, carol)).toHaveLength(0);
    expect(await svc.listConversations(t.db, null)).toHaveLength(0);
  });

  it("blocks outsiders from writing, and participants from changing membership", async () => {
    await expect(svc.upsertConversation(t.db, carol, "c1", { ...conv(), participantIds: [alice.id, bob.id, carol.id] })).rejects.toThrow(/inaccessible/);
    await expect(svc.upsertConversation(t.db, bob, "c1", { ...conv(), participantIds: [bob.id, carol.id] })).rejects.toThrow(/participants/);
    await svc.upsertConversation(t.db, bob, "c1", { ...conv(), messages: [...conv().messages, { senderId: bob.id, text: "Bonjour", ts: 2 }] });
    const [c] = await svc.listConversations(t.db, alice);
    expect((c!["messages"] as unknown[]).length).toBe(2);
  });

  it("lets only participants delete", async () => {
    await expect(svc.deleteConversation(t.db, carol, "c1")).rejects.toThrow(/inaccessible/);
    await svc.deleteConversation(t.db, bob, "c1");
    expect(await svc.listConversations(t.db, alice)).toHaveLength(0);
  });
});

describe("notifications", () => {
  const n = (id: string, over: Record<string, unknown> = {}) => ({ id, recipientId: bob.id, actorId: alice.id, actorName: "Alice", type: "post_like", text: "aime", read: false, ts: 1, ...over });

  it("validates the actor, recipient, type and fields", async () => {
    await expect(svc.createNotification(t.db, alice, "n0", n("n0", { actorId: carol.id }))).rejects.toThrow(/Auteur/);
    await expect(svc.createNotification(t.db, alice, "n0", n("n0", { recipientId: alice.id }))).rejects.toThrow(/Destinataire/);
    await expect(svc.createNotification(t.db, alice, "n0", n("n0", { type: "admin" }))).rejects.toThrow(/Type/);
    await expect(svc.createNotification(t.db, alice, "n0", n("n0", { extra: 1 }))).rejects.toThrow(/non autorisé/);
    await expect(svc.createNotification(t.db, alice, "n0", n("n0", { read: true }))).rejects.toThrow(/lecture/);
    await svc.createNotification(t.db, alice, "n1", n("n1"));
    expect(await svc.listNotifications(t.db, bob)).toHaveLength(1);
    expect(await svc.listNotifications(t.db, alice)).toHaveLength(0);
  });

  it("lets only the recipient change only the read flag, and delete", async () => {
    await expect(svc.updateNotification(t.db, alice, "n1", { ...n("n1"), read: true })).rejects.toThrow(/introuvable/);
    await expect(svc.updateNotification(t.db, bob, "n1", { ...n("n1"), text: "changed", read: true })).rejects.toThrow(/lecture/);
    await svc.updateNotification(t.db, bob, "n1", { ...n("n1"), read: true });
    expect((await svc.listNotifications(t.db, bob))[0]!["read"]).toBe(true);
    await svc.deleteNotification(t.db, alice, "n1");
    expect(await svc.listNotifications(t.db, bob)).toHaveLength(1);
    await svc.deleteNotification(t.db, bob, "n1");
    expect(await svc.listNotifications(t.db, bob)).toHaveLength(0);
  });

  it("allows at most 30 notifications per actor per minute", async () => {
    await Promise.allSettled(Array.from({ length: 29 }, (_, i) => svc.createNotification(t.db, alice, `r${i}`, n(`r${i}`))));
    await expect(svc.createNotification(t.db, alice, "r-over", n("r-over"))).rejects.toThrow(/Trop de notifications/);
  });
});
