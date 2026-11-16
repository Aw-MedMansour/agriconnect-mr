import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";

export type RecordRow = { id: string; created_at: Date | string; [key: string]: unknown };
export function compareRecords(source: RecordRow[], target: RecordRow[]) {
  const targetMap = new Map(target.map((r) => [r.id, r]));
  const missing = source.filter((r) => !targetMap.has(r.id)).map((r) => r.id);
  const changedDates = source
    .filter((r) => {
      const other = targetMap.get(r.id);
      return other && new Date(r.created_at).getTime() !== new Date(other.created_at).getTime();
    })
    .map((r) => r.id);
  return {
    source: source.length,
    target: target.length,
    missing,
    changedDates,
    passed: source.length === target.length && !missing.length && !changedDates.length,
  };
}

export function legacyReferences(value: unknown, path = "$", found: string[] = []): string[] {
  if (
    typeof value === "string" &&
    /(?:\/storage\/v1\/|https?:\/\/[^/\s]+\.supabase\.(?:co|in)\b)/i.test(value)
  )
    found.push(path);
  else if (Array.isArray(value))
    value.forEach((v, i) => legacyReferences(v, `${path}[${i}]`, found));
  else if (value && typeof value === "object")
    Object.entries(value).forEach(([k, v]) => legacyReferences(v, `${path}.${k}`, found));
  return found;
}

export async function verifiedFile(root: string, key: string) {
  const base = await realpath(root);
  const file = await realpath(resolve(base, key));
  if (!file.startsWith(base + sep)) throw new Error("File escapes media root");
  const info = await stat(file);
  if (!info.isFile()) throw new Error("Not a physical file");
  const bytes = await readFile(file);
  return { size: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}

export function retirementAllowed(database: boolean, media: boolean, urls: boolean) {
  return database && media && urls;
}
