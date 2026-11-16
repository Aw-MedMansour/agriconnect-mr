// Persistent media storage on a mounted volume (MEDIA_DIR). Binaries never go in PostgreSQL.
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../db/client.server";
import { mediaFiles } from "../db/schema";
import { AppError, UUID_RE } from "../services/policy";
import type { SessionUser } from "../services/auth.service";
import { hmacHex, sha256Hex, timingSafeEqualHex } from "../auth/tokens";

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
export const SIGNED_URL_TTL_S = 365 * 24 * 3600;

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};
const EXT_ALIASES: Record<string, string[]> = {
  jpg: ["jpg", "jpeg"],
  png: ["png"],
  webp: ["webp"],
  mp4: ["mp4", "m4v", "mov"],
  webm: ["webm"],
};

/** Identify the real type from the file signature (magic bytes), never from the name. */
export function detectMime(b: Uint8Array): string | null {
  const at = (i: number, ...xs: number[]) => xs.every((x, k) => b[i + k] === x);
  const ascii = (i: number, s: string) => [...s].every((c, k) => b[i + k] === c.charCodeAt(0));
  if (b.length < 12) return null;
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  if (ascii(4, "ftyp")) return "video/mp4";
  if (at(0, 0x1a, 0x45, 0xdf, 0xa3)) return "video/webm";
  return null;
}

export function validateUpload(bytes: Uint8Array, claimedType: string, originalName: string) {
  if (!bytes.length) throw new AppError("INVALID", "Fichier vide.");
  if (bytes.length > MAX_MEDIA_BYTES)
    throw new AppError("INVALID", "Fichier trop volumineux (25 Mo maximum).");
  if (!TYPES[claimedType]) throw new AppError("INVALID", "Type de fichier non autorisé.");
  const real = detectMime(bytes);
  if (!real || real !== claimedType)
    throw new AppError("INVALID", "Le contenu du fichier ne correspond pas à son type.");
  const ext = TYPES[real]!;
  const nameExt = (originalName.split(".").pop() || "").toLowerCase();
  if (nameExt && originalName.includes(".") && !EXT_ALIASES[ext]!.includes(nameExt))
    throw new AppError("INVALID", "Extension de fichier non autorisée.");
  return { mime: real, ext };
}

export async function signMediaUrl(secret: string, id: string, ttlSeconds = SIGNED_URL_TTL_S) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = await hmacHex(secret, `media:${id}:${exp}`);
  return `/api/media/${id}?exp=${exp}&sig=${sig}`;
}

export async function verifyMediaSignature(
  secret: string,
  id: string,
  exp: string | null,
  sig: string | null,
) {
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  return timingSafeEqualHex(await hmacHex(secret, `media:${id}:${exp}`), sig);
}

async function fsMods() {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  return { fs, path };
}

/** Resolve a stored key inside MEDIA_DIR; refuses anything escaping the directory. */
export async function resolveInside(mediaDir: string, storageKey: string) {
  const { path } = await fsMods();
  const root = path.resolve(mediaDir);
  const full = path.resolve(root, storageKey);
  if (!full.startsWith(root + path.sep)) throw new AppError("FORBIDDEN", "Chemin invalide.");
  return full;
}

export async function storeMedia(
  db: Db,
  opts: { mediaDir: string; signingSecret: string },
  actor: SessionUser | null,
  file: { bytes: Uint8Array; type: string; name: string },
  legacyPath?: string,
) {
  if (!actor && !legacyPath) throw new AppError("UNAUTHENTICATED", "Authentification requise.");
  const { mime, ext } = validateUpload(file.bytes, file.type, file.name);
  const { fs, path } = await fsMods();
  const id = crypto.randomUUID();
  const now = new Date();
  const storageKey = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}.${ext}`;
  const full = await resolveInside(opts.mediaDir, storageKey);
  await fs.mkdir(path.dirname(full), { recursive: true });
  const tmp = `${full}.part`;
  await fs.writeFile(tmp, file.bytes, { flag: "wx", mode: 0o640 });
  await fs.rename(tmp, full);
  try {
    await db.insert(mediaFiles).values({
      id,
      ownerId: actor?.id ?? null,
      storageKey,
      mimeType: mime,
      sizeBytes: file.bytes.length,
      sha256: await sha256Hex(file.bytes),
      legacyPath: legacyPath ?? null,
    });
  } catch (e) {
    await fs.unlink(full).catch(() => {});
    throw e;
  }
  return { id, url: await signMediaUrl(opts.signingSecret, id) };
}

export async function getMediaRecord(db: Db, id: string) {
  if (!UUID_RE.test(id)) return null;
  const [row] = await db
    .select()
    .from(mediaFiles)
    .where(and(eq(mediaFiles.id, id), isNull(mediaFiles.deletedAt)));
  return row ?? null;
}

export async function deleteMedia(db: Db, mediaDir: string, actor: SessionUser | null, id: string) {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Authentification requise.");
  const row = await getMediaRecord(db, id);
  if (!row) throw new AppError("NOT_FOUND", "Fichier introuvable.");
  if (row.ownerId !== actor.id && !actor.isAdmin)
    throw new AppError("FORBIDDEN", "Suppression réservée au propriétaire.");
  await db.update(mediaFiles).set({ deletedAt: new Date() }).where(eq(mediaFiles.id, id));
  const { fs } = await fsMods();
  await fs.unlink(await resolveInside(mediaDir, row.storageKey)).catch(() => {});
}
