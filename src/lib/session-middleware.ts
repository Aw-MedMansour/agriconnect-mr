import { createMiddleware } from "@tanstack/react-start";

/** Requires a valid server-side session (HttpOnly cookie); exposes the user on context. */
export const requireSession = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { currentUser } = await import("@/server/http.server");
  const user = await currentUser();
  if (!user) throw new Error("Authentification requise.");
  return next({ context: { user, userId: user.id } });
});
