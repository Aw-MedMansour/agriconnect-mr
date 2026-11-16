import { createFileRoute } from "@tanstack/react-router";

// Authenticated multipart upload. Files are validated by content and stored on the media volume.
export const Route = createFileRoute("/api/media/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const http = await import("@/server/http.server");
        try {
          http.assertSameOrigin(request);
          const user = await http.userFromRequest(request);
          if (!user) return Response.json({ error: "Authentification requise." }, { status: 401 });
          const len = Number(request.headers.get("content-length") || 0);
          if (len > 26 * 1024 * 1024)
            return Response.json(
              { error: "Fichier trop volumineux (25 Mo maximum)." },
              { status: 413 },
            );
          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File))
            return Response.json({ error: "Fichier manquant." }, { status: 400 });
          const { getDb } = await import("@/server/db/client.server");
          const { serverEnv } = await import("@/server/env.server");
          const { storeMedia } = await import("@/server/media/media.service");
          const env = serverEnv();
          const result = await storeMedia(
            getDb(),
            { mediaDir: env.mediaDir, signingSecret: env.mediaSigningSecret },
            user,
            { bytes: new Uint8Array(await file.arrayBuffer()), type: file.type, name: file.name },
          );
          return Response.json(result, { status: 201 });
        } catch (e) {
          return http.jsonError(e);
        }
      },
    },
  },
});
