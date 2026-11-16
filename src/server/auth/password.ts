// Argon2id (OWASP parameters: m=19 MiB, t=2, p=1) via WebAssembly — no native addon required.
import { argon2id, argon2Verify } from "hash-wasm";
import bcrypt from "bcryptjs";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 256;

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 2,
    memorySize: 19456,
    hashLength: 32,
    outputType: "encoded",
  });
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  try {
    return await argon2Verify({ password, hash: encoded });
  } catch {
    return false;
  }
}

/** Imported bcrypt hashes (previous auth system) are verified once, then upgraded to argon2id. */
export async function verifyLegacyBcrypt(password: string, hash: string): Promise<boolean> {
  if (!/^\$2[aby]\$\d{2}\$/.test(hash)) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

let dummy: Promise<string> | undefined;
/** Constant work for unknown accounts so timing does not reveal which emails exist. */
export async function burnPasswordCheck(password: string) {
  dummy ??= hashPassword("agriconnect-dummy-password");
  await verifyPassword(password, await dummy);
}
