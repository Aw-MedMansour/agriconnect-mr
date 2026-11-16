import { createFileRoute } from "@tanstack/react-router";

// Readiness probe: the database answers. Liveness stays on /api/health.
export const Route = createFileRoute("/api/ready")({
  server: {
    handlers: {
      GET: async () => {
        const { pingDb } = await import("@/server/db/client.server");
        const ok = await pingDb().catch(() => false);
        return Response.json(
          { status: ok ? "ready" : "database_unavailable" },
          { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
