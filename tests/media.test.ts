import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migratedDb, SECRET } from "./helpers";
import { signUp, type SessionUser } from "../src/server/services/auth.service";
import { deleteMedia, detectMime, getMediaRecord, resolveInside, signMediaUrl, storeMedia, validateUpload, verifyMediaSignature } from "../src/server/media/media.service";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1]);
const MP4 = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]);
const HTML = new TextEncoder().encode("<html><script>alert(1)</script></html>");
const MEDIA_SECRET = "media-signing-secret-0123456789abcdef0123456789";

let t: Awaited<ReturnType<typeof migratedDb>>;
let alice: SessionUser, bob: SessionUser;
let dir: string;
beforeAll(async () => {
  t = await migratedDb();
  dir = mkdtempSync(join(tmpdir(), "media-"));
  alice = (await signUp(t.db, SECRET, { email: "m1@example.com", password: "password-123" }, { ip: "m1" })).user;
  bob = (await signUp(t.db, SECRET, { email: "m2@example.com", password: "password-123" }, { ip: "m2" })).user;
});
afterAll(async () => { await t.close(); });

describe("media validation", () => {
  it("detects the real type from file content", () => {
    expect(detectMime(PNG)).toBe("image/png");
    expect(detectMime(JPG)).toBe("image/jpeg");
    expect(detectMime(MP4)).toBe("video/mp4");
    expect(detectMime(HTML)).toBeNull();
  });
  it("rejects spoofed types, bad extensions, empty and oversized files", () => {
    expect(() => validateUpload(HTML, "image/png", "x.png")).toThrow(/ne correspond pas/);
    expect(() => validateUpload(PNG, "image/jpeg", "x.jpg")).toThrow(/ne correspond pas/);
    expect(() => validateUpload(PNG, "image/png", "x.php")).toThrow(/Extension/);
    expect(() => validateUpload(PNG, "image/svg+xml", "x.svg")).toThrow(/non autorisé/);
    expect(() => validateUpload(new Uint8Array(), "image/png", "x.png")).toThrow(/vide/);
    expect(() => validateUpload(new Uint8Array(25 * 1024 * 1024 + 1), "image/png", "x.png")).toThrow(/volumineux/);
  });
  it("refuses paths escaping the media directory", async () => {
    await expect(resolveInside(dir, "../../etc/passwd")).rejects.toThrow(/Chemin/);
    await expect(resolveInside(dir, "/etc/passwd")).rejects.toThrow(/Chemin/);
  });
});

describe("media storage", () => {
  it("stores the upload under a random name on the volume and records it", async () => {
    await expect(storeMedia(t.db, { mediaDir: dir, signingSecret: MEDIA_SECRET }, null, { bytes: PNG, type: "image/png", name: "a.png" })).rejects.toThrow(/Authentification/);
    const r = await storeMedia(t.db, { mediaDir: dir, signingSecret: MEDIA_SECRET }, alice, { bytes: PNG, type: "image/png", name: "../../evil name.png" });
    const row = await getMediaRecord(t.db, r.id);
    expect(row!.storageKey).toMatch(/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/);
    expect(row!.storageKey).not.toContain("evil");
    expect(readFileSync(join(dir, row!.storageKey))).toEqual(Buffer.from(PNG));
    expect(r.url).toMatch(new RegExp(`^/api/media/${r.id}\\?exp=\\d+&sig=[0-9a-f]{64}$`));
  });

  it("verifies signed URLs and rejects tampered or expired ones", async () => {
    const url = new URL(await signMediaUrl(MEDIA_SECRET, "11111111-1111-1111-1111-111111111111"), "http://x");
    const exp = url.searchParams.get("exp"), sig = url.searchParams.get("sig");
    expect(await verifyMediaSignature(MEDIA_SECRET, "11111111-1111-1111-1111-111111111111", exp, sig)).toBe(true);
    expect(await verifyMediaSignature(MEDIA_SECRET, "22222222-2222-2222-2222-222222222222", exp, sig)).toBe(false);
    expect(await verifyMediaSignature("other-secret-0123456789abcdef0123456789", "11111111-1111-1111-1111-111111111111", exp, sig)).toBe(false);
    const expired = new URL(await signMediaUrl(MEDIA_SECRET, "11111111-1111-1111-1111-111111111111", -10), "http://x");
    expect(await verifyMediaSignature(MEDIA_SECRET, "11111111-1111-1111-1111-111111111111", expired.searchParams.get("exp"), expired.searchParams.get("sig"))).toBe(false);
  });

  it("lets only the owner delete a file", async () => {
    const r = await storeMedia(t.db, { mediaDir: dir, signingSecret: MEDIA_SECRET }, alice, { bytes: JPG, type: "image/jpeg", name: "b.jpg" });
    const key = (await getMediaRecord(t.db, r.id))!.storageKey;
    await expect(deleteMedia(t.db, dir, bob, r.id)).rejects.toThrow(/propriétaire/);
    await deleteMedia(t.db, dir, alice, r.id);
    expect(await getMediaRecord(t.db, r.id)).toBeNull();
    expect(existsSync(join(dir, key))).toBe(false);
  });
});
