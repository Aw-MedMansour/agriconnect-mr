// Production entrypoint: validates configuration, checks the media volume, then starts the Nitro server.
import { accessSync, constants, mkdirSync } from "node:fs";

const required = ["DATABASE_URL", "SESSION_SECRET", "MEDIA_SIGNING_SECRET"];
const missing = required.filter((k) => !process.env[k]);
for (const k of ["SESSION_SECRET", "MEDIA_SIGNING_SECRET"]) {
  if (process.env[k] && process.env[k].length < 32) missing.push(`${k} (min 32 characters)`);
}
if (missing.length) {
  console.error(`[startup] Missing or invalid environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}
if (!process.env.LOVABLE_API_KEY) console.warn("[startup] LOVABLE_API_KEY not set: Plant AI and photo analysis will be unavailable.");

process.env.MEDIA_DIR ||= "/app/data/media";
try {
  mkdirSync(process.env.MEDIA_DIR, { recursive: true });
  accessSync(process.env.MEDIA_DIR, constants.W_OK);
} catch (e) {
  console.error(`[startup] Media directory ${process.env.MEDIA_DIR} is not writable: ${e.message}`);
  process.exit(1);
}

process.env.HOST ||= "0.0.0.0";
process.env.PORT ||= "3000";

const shutdown = (signal) => {
  console.log(`[shutdown] ${signal} received, closing connections.`);
  setTimeout(() => process.exit(0), 8000).unref();
};
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

console.log(`[startup] AgriConnect listening on ${process.env.HOST}:${process.env.PORT}`);
await import("../.output/server/index.mjs");
