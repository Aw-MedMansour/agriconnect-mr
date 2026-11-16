// Server functions replacing every former direct database call from the browser.
// The acting user always comes from the validated session cookie, never from the request body.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Table = z.enum(["users", "posts", "products", "services", "conversations", "notifications"]);
const Write = z.object({ table: Table, id: z.string().min(1).max(200), data: z.record(z.string(), z.unknown()) });
const Ref = z.object({ table: Table, id: z.string().min(1).max(200) });

async function ctx() {
  const { getDb } = await import("@/server/db/client.server");
  const http = await import("@/server/http.server");
  const svc = await import("@/server/services/data.service");
  return { db: getDb(), actor: await http.currentUser(), svc };
}

export const fetchAllFn = createServerFn({ method: "GET" }).handler(async () => {
  const { db, actor, svc } = await ctx();
  const [users, products, services, posts, conversations] = await Promise.all([
    svc.listPublicProfiles(db, actor), svc.listContent(db, "products"), svc.listContent(db, "services"),
    svc.listContent(db, "posts"), svc.listConversations(db, actor),
  ]);
  return { users, products, services, posts, conversations } as Record<string, unknown[]>;
});

export const fetchConversationsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { db, actor, svc } = await ctx();
  return (await svc.listConversations(db, actor)) as unknown[];
});

export const fetchUsersFn = createServerFn({ method: "GET" }).handler(async () => {
  const { db, actor, svc } = await ctx();
  return (await svc.listPublicProfiles(db, actor)) as unknown[];
});

export const fetchNotificationsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { db, actor, svc } = await ctx();
  return (await svc.listNotifications(db, actor)) as unknown[];
});

export const getOwnProfileFn = createServerFn({ method: "GET" }).handler(async () => {
  const { db, actor, svc } = await ctx();
  if (!actor) return null;
  return (await svc.getOwnProfile(db, actor)) as Record<string, unknown> | null;
});

export const upsertFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => Write.parse(d))
  .handler(async ({ data }) => {
    const { db, actor, svc } = await ctx();
    if (data.table === "users") await svc.saveOwnProfile(db, actor, data.id, data.data);
    else if (data.table === "conversations") await svc.upsertConversation(db, actor, data.id, data.data);
    else if (data.table === "notifications") await svc.updateNotification(db, actor, data.id, data.data);
    else await svc.upsertContent(db, actor, data.table, data.id, data.data);
    return { ok: true };
  });

export const insertFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => Write.parse(d))
  .handler(async ({ data }) => {
    const { db, actor, svc } = await ctx();
    if (data.table === "notifications") await svc.createNotification(db, actor, data.id, data.data);
    else if (data.table === "users") await svc.saveOwnProfile(db, actor, data.id, data.data);
    else if (data.table === "conversations") await svc.upsertConversation(db, actor, data.id, data.data);
    else await svc.upsertContent(db, actor, data.table, data.id, data.data);
    return { ok: true };
  });

export const deleteFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => Ref.parse(d))
  .handler(async ({ data }) => {
    const { db, actor, svc } = await ctx();
    if (data.table === "conversations") await svc.deleteConversation(db, actor, data.id);
    else if (data.table === "notifications") await svc.deleteNotification(db, actor, data.id);
    else if (data.table === "users") throw new Error("Suppression de profil non autorisée.");
    else await svc.deleteContent(db, actor, data.table, data.id);
    return { ok: true };
  });

export const registerViewFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ table: z.enum(["posts", "products", "services"]), id: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { db, svc } = await ctx();
    await svc.registerView(db, data.table, data.id);
    return { ok: true };
  });
