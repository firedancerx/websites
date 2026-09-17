// T-510 (F-15): issues the fd_csrf cookie for every visitor, on every request.
//
// This is the ONLY thing this middleware does. Next.js forbids setting
// cookies during a page's Server Component render (only Route Handlers and
// Middleware may write cookies), so a page like app/login/page.tsx cannot
// call jar.set() itself when it needs to hand a fresh visitor their first
// CSRF token to embed in the form it renders. Middleware runs ahead of that
// render on the same request and, via the request-cookie-forwarding pattern
// below, makes the token visible to cookies().get() inside the page too.
//
// Deliberately Edge-safe and dependency-free: no lib/db.ts (mysql2) or
// node:crypto import here, since those don't run in the Edge runtime
// middleware executes under. Actual CSRF *validation* happens separately,
// per-route, inside the Node.js route handlers in app/api/**/route.ts
// (lib/csrf.ts's validateCsrf()) -- this file never validates anything,
// it only ensures a token exists to validate against.
import { NextResponse, type NextRequest } from "next/server";

const CSRF_COOKIE = "fd_csrf";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function middleware(request: NextRequest) {
  if (request.cookies.get(CSRF_COOKIE)?.value) {
    return NextResponse.next();
  }

  const token = generateToken();
  // Forward the new cookie onto the request Next.js hands to the page render
  // for THIS same request, so cookies().get(CSRF_COOKIE) inside a Server
  // Component sees it immediately rather than only on the visitor's next visit.
  request.cookies.set(CSRF_COOKIE, token);
  const response = NextResponse.next({ request });
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

export const config = {
  // Runs on every page and API route except static assets, matching the
  // convention from Next.js's own middleware docs.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
