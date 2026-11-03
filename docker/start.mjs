// Production entrypoint: validates configuration, then starts the Nitro Node server.
const required = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"];
const recommended = ["LOVABLE_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[startup] Missing required environment variable(s): ${missing.join(", ")}`);
  console.error("[startup] Set them in Coolify (Environment Variables) or in your .env file.");
  process.exit(1);
}
for (const k of recommended) {
  if (!process.env[k]) console.warn(`[startup] Optional variable ${k} is not set; related features will fail.`);
}

process.env.HOST ||= "0.0.0.0";
process.env.PORT ||= "3000";

const shutdown = (signal) => {
  console.log(`[shutdown] ${signal} received, exiting.`);
  setTimeout(() => process.exit(0), 5000).unref();
};
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

console.log(`[startup] AgriConnect listening on ${process.env.HOST}:${process.env.PORT}`);
await import("../.output/server/index.mjs");
