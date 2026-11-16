// Shared helpers for server functions and API routes (session cookie, errors, client meta).
import { getCookie, getRequestHeader, getRequestIP, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { getDb } from "./db/client.server";
import { serverEnv } from "./env.server";
import { AppError } from "./services/policy";
import { SESSION_COOKIE, SESSION_TTL_MS, resolveSession, type SessionUser } from "./services/auth.service";

export function clientMeta() {
  return { ip: getRequestIP({ xForwardedFor: true }) ?? null, userAgent: getRequestHeader("user-agent") ?? null };
}

export function writeSessionCookie(token: string) {
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true, secure: serverEnv().isProduction, sameSite: "lax", path: "/", maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}
export function clearSessionCookie() { deleteCookie(SESSION_COOKIE, { path: "/" }); }
export const readSessionToken = () => getCookie(SESSION_COOKIE);

export async function currentUser(): Promise<SessionUser | null> {
  return resolveSession(getDb(), serverEnv().sessionSecret, readSessionToken());
}

/** Session from a raw Request (API routes). */
export async function userFromRequest(request: Request): Promise<SessionUser | null> {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  return resolveSession(getDb(), serverEnv().sessionSecret, m ? decodeURIComponent(m.slice(SESSION_COOKIE.length + 1)) : null);
}

const STATUS: Record<AppError["code"], number> = { UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, INVALID: 400, CONFLICT: 409, RATE_LIMITED: 429 };
export function jsonError(e: unknown) {
  if (e instanceof AppError) return Response.json({ error: e.message, code: e.code }, { status: STATUS[e.code] });
  console.error(e);
  return Response.json({ error: "Erreur interne." }, { status: 500 });
}

/** Same-origin check for cookie-authenticated API routes (CSRF). */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) throw new AppError("FORBIDDEN", "Origine refusée.");
}
