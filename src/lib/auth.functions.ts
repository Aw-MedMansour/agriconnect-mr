import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Credentials = z.object({ email: z.string().max(254), password: z.string().max(256) });

export const signUpFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => Credentials.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("@/server/db/client.server");
    const { serverEnv } = await import("@/server/env.server");
    const { signUp } = await import("@/server/services/auth.service");
    const http = await import("@/server/http.server");
    const { token, user } = await signUp(getDb(), serverEnv().sessionSecret, data, http.clientMeta());
    http.writeSessionCookie(token);
    return { user: { id: user.id, email: user.email } };
  });

export const signInFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => Credentials.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("@/server/db/client.server");
    const { serverEnv } = await import("@/server/env.server");
    const { signIn, revokeSession } = await import("@/server/services/auth.service");
    const http = await import("@/server/http.server");
    await revokeSession(getDb(), serverEnv().sessionSecret, http.readSessionToken()); // rotate
    const { token, user } = await signIn(getDb(), serverEnv().sessionSecret, data, http.clientMeta());
    http.writeSessionCookie(token);
    return { user: { id: user.id, email: user.email } };
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { getDb } = await import("@/server/db/client.server");
  const { serverEnv } = await import("@/server/env.server");
  const { revokeSession } = await import("@/server/services/auth.service");
  const http = await import("@/server/http.server");
  await revokeSession(getDb(), serverEnv().sessionSecret, http.readSessionToken());
  http.clearSessionCookie();
  return { ok: true };
});

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const http = await import("@/server/http.server");
  const user = await http.currentUser();
  return { user: user ? { id: user.id, email: user.email, isAdmin: user.isAdmin } : null };
});
