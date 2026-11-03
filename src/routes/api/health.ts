import { createFileRoute } from "@tanstack/react-router";

// Liveness probe for Docker / Coolify. Returns no private data.
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify({ status: "ok", time: new Date().toISOString() }), {
          status: 200,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        }),
    },
  },
});
