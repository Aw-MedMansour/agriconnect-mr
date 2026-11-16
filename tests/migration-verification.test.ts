import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  compareRecords,
  legacyReferences,
  retirementAllowed,
  verifiedFile,
} from "../scripts/supabase-import/verification-lib";

describe("final migration verification", () => {
  it("blocks retirement unless all three conditions pass", () => {
    for (const state of [
      [false, true, true],
      [true, false, true],
      [true, true, false],
      [false, false, false],
    ]) {
      expect(retirementAllowed(Boolean(state[0]), Boolean(state[1]), Boolean(state[2]))).toBe(
        false,
      );
    }
    expect(retirementAllowed(true, true, true)).toBe(true);
  });
  it("compares IDs and dates, not just identical record counts", () => {
    const row = { id: "original", created_at: "2026-11-16T00:00:00Z" };
    expect(compareRecords([row], [{ ...row, id: "other" }]).missing).toEqual(["original"]);
    expect(compareRecords([row], [{ ...row, created_at: "2026-11-15T00:00:00Z" }]).passed).toBe(
      false,
    );
    expect(compareRecords([row], [row]).passed).toBe(true);
  });
  it("detects nested signed, public, render and authenticated storage references", () => {
    expect(
      legacyReferences({
        photos: [
          "https://old.example/storage/v1/object/sign/b/a?token=x",
          "https://old.example/storage/v1/render/image/public/b/a",
          "https://old.example/storage/v1/object/authenticated/b/a",
        ],
      }),
    ).toHaveLength(3);
    expect(legacyReferences({ url: "/api/media/id?exp=123&sig=abc" })).toEqual([]);
  });
  it("checks actual file bytes and rejects missing files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "verify-media-"));
    try {
      await writeFile(join(dir, "original"), "original bytes");
      const before = await verifiedFile(dir, "original");
      await writeFile(join(dir, "original"), "corrupted bytes");
      expect((await verifiedFile(dir, "original")).sha256).not.toBe(before.sha256);
      await expect(verifiedFile(dir, "missing")).rejects.toThrow();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
