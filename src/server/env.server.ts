// Server-only configuration. Never import from browser code; never prefix these with VITE_.
export type ServerEnv = {
  databaseUrl: string;
  sessionSecret: string;
  mediaDir: string;
  mediaSigningSecret: string;
  isProduction: boolean;
};

const REQUIRED = ["DATABASE_URL", "SESSION_SECRET", "MEDIA_SIGNING_SECRET"] as const;

export function missingServerEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const missing: string[] = REQUIRED.filter((k) => !env[k]);
  for (const k of ["SESSION_SECRET", "MEDIA_SIGNING_SECRET"] as const) {
    if (env[k] && env[k]!.length < 32) missing.push(`${k} (min 32 chars)`);
  }
  return missing;
}

export function serverEnv(): ServerEnv {
  const missing = missingServerEnv();
  if (missing.length) throw new Error(`Configuration serveur incomplète : ${missing.join(", ")}`);
  return {
    databaseUrl: process.env["DATABASE_URL"]!,
    sessionSecret: process.env["SESSION_SECRET"]!,
    mediaDir: process.env["MEDIA_DIR"] || "/app/data/media",
    mediaSigningSecret: process.env["MEDIA_SIGNING_SECRET"]!,
    isProduction: process.env["NODE_ENV"] === "production",
  };
}
