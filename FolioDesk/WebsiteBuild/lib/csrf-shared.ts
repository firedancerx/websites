// T-510 (F-15): constants + browser-safe helpers shared between server code
// (lib/csrf.ts, which additionally needs node:crypto and next/headers and so
// cannot be imported from a "use client" file) and client components that
// drive a fetch() POST and need to read the same CSRF cookie to set a header.
export const CSRF_COOKIE = "fd_csrf";
export const CSRF_FIELD = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

// Reads the non-httpOnly fd_csrf cookie from the browser. Safe to call from
// any client component; returns "" outside a browser (SSR) or before the
// cookie has been set by a prior page render's ensureCsrfCookie() call.
export function getCsrfCookieClient(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}
