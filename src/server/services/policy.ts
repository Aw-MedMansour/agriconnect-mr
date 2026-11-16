// Pure authorization / validation rules recreated from the previous database policies.
export class AppError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID" | "CONFLICT" | "RATE_LIMITED", message: string) {
    super(message);
  }
}

export const CONTENT_TABLES = ["posts", "products", "services"] as const;
export type ContentTable = (typeof CONTENT_TABLES)[number];
export const OWNER_KEY: Record<ContentTable, string> = { posts: "authorId", products: "sellerId", services: "providerId" };

export const CONTACT_KEYS = [
  "email", "phone", "address", "adresse", "whatsapp", "password", "tel", "telephone", "mobile", "contact",
  "sellerEmail", "sellerPhone", "sellerWhatsapp", "sellerAddress",
  "providerEmail", "providerPhone", "providerWhatsapp", "providerAddress",
  "authorEmail", "authorPhone", "authorWhatsapp", "authorAddress",
  "contactEmail", "contactPhone", "contactWhatsapp",
];

export const PUBLIC_PROFILE_KEYS = [
  "id", "name", "avatar", "coverImage", "bio", "company", "role", "roleLabel", "badge", "verified",
  "rating", "reviewsCount", "transactionsCount", "specialties", "zone", "location",
];

export const INTERACTION_KEYS = ["likedBy", "likesCount", "comments", "repostedBy", "sharesCount", "viewsCount"];

export const NOTIFICATION_TYPES = ["message", "follow", "post_like", "post_comment", "comment_reply", "comment_reaction", "product_like", "product_comment", "repost"];
const NOTIFICATION_KEYS = ["id", "recipientId", "actorId", "actorName", "actorAvatar", "type", "text", "target", "read", "ts"];

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Doc = Record<string, unknown>;

export function assertDocument(data: unknown): Doc {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new AppError("INVALID", "Données invalides.");
  if (JSON.stringify(data).length > MAX_DOCUMENT_BYTES) throw new AppError("INVALID", "Contenu trop volumineux.");
  return data as Doc;
}

export const omitKeys = (d: Doc, keys: string[]) => Object.fromEntries(Object.entries(d).filter(([k]) => !keys.includes(k)));
export const pickKeys = (d: Doc, keys: string[]) => Object.fromEntries(Object.entries(d).filter(([k]) => keys.includes(k)));
export const stripContact = (d: Doc) => omitKeys(d, CONTACT_KEYS);
export const publicProfile = (d: Doc) => pickKeys(stripContact(d), PUBLIC_PROFILE_KEYS);

/** Stable deep equality for JSON documents (key order independent). */
export function sameJson(a: unknown, b: unknown): boolean {
  const norm = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(norm)
      : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as Doc).sort().map((k) => [k, norm((v as Doc)[k])]))
        : v;
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
}

/** A non-owner may only change interaction counters (likes, comments, shares, reposts, views). */
export function onlyInteractionsChanged(before: Doc, after: Doc): boolean {
  return sameJson(omitKeys(before, INTERACTION_KEYS), omitKeys(after, INTERACTION_KEYS));
}

export function validateNotification(id: string, data: Doc, actorId: string): void {
  const bad = (m: string) => { throw new AppError("INVALID", m); };
  if (String(data["actorId"]) !== actorId) bad("Auteur de notification invalide.");
  const recipient = String(data["recipientId"] ?? "");
  if (!UUID_RE.test(recipient) || recipient === actorId) bad("Destinataire invalide.");
  if (!NOTIFICATION_TYPES.includes(String(data["type"]))) bad("Type de notification inconnu.");
  if (Object.keys(data).some((k) => !NOTIFICATION_KEYS.includes(k))) bad("Champ de notification non autorisé.");
  if (String(data["id"]) !== id) bad("Identifiant incohérent.");
  if (String(data["text"] ?? "").length > 300) bad("Texte trop long.");
  if (String(data["actorName"] ?? "").length > 120) bad("Nom trop long.");
  if (String(data["actorAvatar"] ?? "").length > 500) bad("Avatar trop long.");
  if (data["read"] !== undefined && data["read"] !== false) bad("Statut de lecture invalide.");
  const target = data["target"];
  if (target !== undefined && (typeof target !== "object" || target === null || Array.isArray(target))) bad("Cible invalide.");
}

export function normalizeEmail(email: unknown): string {
  const e = String(email ?? "").trim().toLowerCase();
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new AppError("INVALID", "Adresse e-mail invalide.");
  return e;
}
