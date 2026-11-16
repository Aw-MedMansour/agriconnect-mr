import { createFileRoute } from "@tanstack/react-router";

// Serves a stored file: valid signed URL, or the owner's session. Supports byte ranges for video.
export const Route = createFileRoute("/api/media/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const http = await import("@/server/http.server");
        try {
          const { getDb } = await import("@/server/db/client.server");
          const { serverEnv } = await import("@/server/env.server");
          const media = await import("@/server/media/media.service");
          const env = serverEnv();
          const url = new URL(request.url);
          const row = await media.getMediaRecord(getDb(), params.id);
          if (!row) return new Response("Not found", { status: 404 });
          const signed = await media.verifyMediaSignature(
            env.mediaSigningSecret,
            row.id,
            url.searchParams.get("exp"),
            url.searchParams.get("sig"),
          );
          if (!signed) {
            const user = await http.userFromRequest(request);
            if (!user || (user.id !== row.ownerId && !user.isAdmin))
              return new Response("Forbidden", { status: 403 });
          }
          const fs = await import("node:fs");
          const full = await media.resolveInside(env.mediaDir, row.storageKey);
          const size = (await fs.promises.stat(full)).size;
          const headers = new Headers({
            "content-type": row.mimeType,
            "accept-ranges": "bytes",
            "x-content-type-options": "nosniff",
            "cache-control": signed ? "private, max-age=86400" : "private, no-store",
            "content-security-policy": "default-src 'none'; sandbox",
          });
          const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
          let start = 0,
            end = size - 1,
            status = 200;
          if (range) {
            start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
            end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
            if (start > end || start >= size)
              return new Response(null, {
                status: 416,
                headers: { "content-range": `bytes */${size}` },
              });
            status = 206;
            headers.set("content-range", `bytes ${start}-${end}/${size}`);
          }
          headers.set("content-length", String(end - start + 1));
          const { Readable } = await import("node:stream");
          const body = Readable.toWeb(
            fs.createReadStream(full, { start, end }),
          ) as unknown as ReadableStream;
          return new Response(body, { status, headers });
        } catch (e) {
          return http.jsonError(e);
        }
      },
      DELETE: async ({ request, params }) => {
        const http = await import("@/server/http.server");
        try {
          http.assertSameOrigin(request);
          const { getDb } = await import("@/server/db/client.server");
          const { serverEnv } = await import("@/server/env.server");
          const { deleteMedia } = await import("@/server/media/media.service");
          await deleteMedia(
            getDb(),
            serverEnv().mediaDir,
            await http.userFromRequest(request),
            params.id,
          );
          return new Response(null, { status: 204 });
        } catch (e) {
          return http.jsonError(e);
        }
      },
    },
  },
});
