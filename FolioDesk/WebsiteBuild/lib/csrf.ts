// T-510 (finding F-15): CSRF protection, synchronizer-token pattern.
//
// One cookie (fd_csrf, non-httpOnly so it can be read both by the server
// when rendering a hidden field and by client JS for fetch()-driven POSTs,
// see lib/csrf-shared.ts's getCsrfCookieClient()) backs two checks:
//   - Double-submit check (always): the submitted token must equal the
//     request's own fd_csrf cookie value. An attacker's cross-site form
//     cannot read or set this site's cookie, so it cannot produce a match.
//   - Synchronizer check (authenticated requests only): the submitted
//     token's hash must also equal sessions.csrf_token_hash, set once at
//     login in createSession(). This binds the token to server-side state
//     rather than trusting the cookie echo alone.
//
// Server-only (node:crypto, next/headers) -- client components import
// CSRF_COOKIE/CSRF_FIELD/CSRF_HEADER/getCsrfCookieClient from
// ./csrf-shared instead.
import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export { CSRF_COOKIE, CSRF_FIELD, CSRF_HEADER } from "./csrf-shared";
import { CSRF_COOKIE, CSRF_FIELD, CSRF_HEADER } from "./csrf-shared";

export function hashCsrfToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Call from any page (Server Component) that renders a <form> or drives a
// fetch() POST, to read the token to embed. Read-only by design: Next.js
// forbids setting cookies during a page render (only Route Handlers and
// Middleware may do that), so the cookie itself is issued by middleware.ts
// on every request ahead of the page render, and forwarded onto the request
// so it's already visible here. The generated fallback below only fires if
// middleware's matcher somehow didn't cover this route -- it renders a
// syntactically valid but real token that won't match the visitor's actual
// cookie, so the resulting form fails closed (rejected as invalid) rather
// than silently succeeding without a real check.
export async function ensureCsrfCookie(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  return generateCsrfToken();
}

// Rotates the cookie to a fresh token whose hash is what createSession()
// stores on the new session row, so a pre-login anonymous token can no
// longer authorize anything post-login (session fixation hygiene).
export async function issueSessionCsrfToken(): Promise<{ token: string; hash: string }> {
  const jar = await cookies();
  const token = generateCsrfToken();
  jar.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return { token, hash: hashCsrfToken(token) };
}

// Validates a submitted token against this request's own cookie, and -- when
// the caller passes the current session's stored hash -- also against that
// server-side value. Pass `sessionCsrfHash` for every authenticated route;
// omit it only for genuinely pre-authentication routes (login, register,
// forgot-password) where no session row exists yet to bind against.
export async function validateCsrf(
  submitted: string | null | undefined,
  sessionCsrfHash?: string | null
): Promise<boolean> {
  if (!submitted) return false;
  const jar = await cookies();
  const cookieToken = jar.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;
  if (!timingSafeEqualStr(cookieToken, submitted)) return false;
  if (sessionCsrfHash) {
    if (!timingSafeEqualStr(hashCsrfToken(submitted), sessionCsrfHash)) return false;
  }
  return true;
}

// Convenience for API routes that already parsed formData as `f`.
export async function validateCsrfFromForm(
  f: FormData,
  sessionCsrfHash?: string | null
): Promise<boolean> {
  return validateCsrf(String(f.get(CSRF_FIELD) || ""), sessionCsrfHash);
}

// Convenience for fetch()-driven JSON POST routes, where the token travels
// as a header (set client-side via getCsrfCookieClient()) rather than a
// form field.
export async function validateCsrfFromHeader(
  req: Request,
  sessionCsrfHash?: string | null
): Promise<boolean> {
  return validateCsrf(req.headers.get(CSRF_HEADER), sessionCsrfHash);
}
