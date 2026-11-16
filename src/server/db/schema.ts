// AgriConnect MR — single source of truth for the self-hosted PostgreSQL schema.
// Change this file, then run `bun run db:generate` and review the SQL in db/migrations.
import { sql } from "drizzle-orm";
import {
  pgTable, pgEnum, uuid, text, jsonb, timestamp, boolean, integer, bigint,
  primaryKey, uniqueIndex, index, check,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const appRole = pgEnum("app_role", ["admin", "moderator", "user"]);

/** Login identities. Password hashes never leave the server. */
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),             // argon2id (PHC string)
  legacyBcryptHash: text("legacy_bcrypt_hash"),    // imported hash, upgraded to argon2id at next login
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  disabledAt: ts("disabled_at"),
}, (t) => [
  uniqueIndex("accounts_email_lower_uq").on(sql`lower(${t.email})`),
  check("accounts_has_credential", sql`${t.passwordHash} IS NOT NULL OR ${t.legacyBcryptHash} IS NOT NULL`),
]);

/** Roles live in their own table (never in user-editable profile data). */
export const userRoles = pgTable("user_roles", {
  userId: uuid("user_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  role: appRole("role").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.role] })]);

/** Server-side sessions. Only a keyed hash of the cookie token is stored. */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  createdAt: ts("created_at").notNull().defaultNow(),
  lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
  expiresAt: ts("expires_at").notNull(),
  userAgent: text("user_agent"),
  ip: text("ip"),
}, (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)]);

/** Fixed-window counters for login / signup throttling. */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").notNull(),
  windowStart: ts("window_start").notNull(),
  count: integer("count").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.key, t.windowStart] })]);

/** Full member profile (private: contact fields included). Document shape kept from the app. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => accounts.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

const contentTable = (name: "products" | "services" | "posts") =>
  pgTable(name, {
    id: text("id").primaryKey(),
    ownerId: uuid("owner_id").references(() => accounts.id, { onDelete: "cascade" }), // null = seeded demo content
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  }, (t) => [
    index(`${name}_owner_idx`).on(t.ownerId),
    index(`${name}_created_idx`).on(t.createdAt),
  ]);

export const products = contentTable("products");
export const services = contentTable("services");
export const posts = contentTable("posts");

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

/** Membership drives authorization for conversations. */
export const conversationParticipants = pgTable("conversation_participants", {
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.conversationId, t.userId] }), index("conv_participants_user_idx").on(t.userId)]);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  recipientId: uuid("recipient_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => accounts.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  read: boolean("read").notNull().default(false),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  index("notifications_recipient_created_idx").on(t.recipientId, t.createdAt),
  index("notifications_actor_created_idx").on(t.actorId, t.createdAt),
]);

/** Metadata of files stored on the media volume (binaries never go in the database). */
export const mediaFiles = pgTable("media_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => accounts.id, { onDelete: "set null" }),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  sha256: text("sha256").notNull(),
  legacyPath: text("legacy_path"), // original Supabase Storage path for imported files
  createdAt: ts("created_at").notNull().defaultNow(),
  deletedAt: ts("deleted_at"),
}, (t) => [
  uniqueIndex("media_files_storage_key_uq").on(t.storageKey),
  uniqueIndex("media_files_legacy_path_uq").on(t.legacyPath),
  index("media_files_owner_idx").on(t.ownerId),
  check("media_files_size_positive", sql`${t.sizeBytes} > 0`),
]);
