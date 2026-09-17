import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { createSession, verifyPassword, getBaseUrl } from "../../../lib/auth";
import { validateCsrfFromForm } from "../../../lib/csrf";
import { checkRateLimit, getClientIp } from "../../../lib/rate-limit";

// T-510 (F-15): 10 attempts per 5-minute window per IP+email pair. Keyed on
// the pair (not IP alone) so one office's shared IP can't lock every account
// behind it out from a single bad actor targeting one address, and one
// attacker can't brute-force a single account from behind a large botnet's
// worth of distinct IPs without also being rate-limited per IP.
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_SECONDS = 300;

export async function POST(req: Request) {
  const f = await req.formData();
  const email = String(f.get("email") || "").toLowerCase();
  const password = String(f.get("password") || "");

  if (!(await validateCsrfFromForm(f))) {
    return NextResponse.redirect(
      new URL("/foliodesk/login?error=Your+session+expired.+Please+try+again.", getBaseUrl(req)),
      303
    );
  }

  const ip = getClientIp(req);
  const ipLimit = await checkRateLimit(ip, "login", LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS);
  const pairLimit = await checkRateLimit(`${ip}:${email}`, "login", LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS);
  if (!ipLimit.allowed || !pairLimit.allowed) {
    return NextResponse.redirect(
      new URL("/foliodesk/login?error=Too+many+attempts.+Please+wait+a+few+minutes+and+try+again.", getBaseUrl(req)),
      303
    );
  }

  try {
    const [rows] = await db().execute<DatabaseRow[]>(
      "SELECT id,password_hash,role,status FROM users WHERE email=? LIMIT 1",
      [email]
    );
    const u = rows[0];
    if (!u || u.status !== "ACTIVE" || !verifyPassword(password, u.password_hash)) throw new Error();
    await createSession(u.id);
    return NextResponse.redirect(
      new URL(u.role === "ADMIN" ? "/foliodesk/admin" : u.role === "MANAGEMENT" ? "/foliodesk/management/queue" : "/foliodesk/portal", getBaseUrl(req)),
      303
    );
  } catch {
    return NextResponse.redirect(new URL("/foliodesk/login?error=Invalid+email+or+password", getBaseUrl(req)), 303);
  }
}
