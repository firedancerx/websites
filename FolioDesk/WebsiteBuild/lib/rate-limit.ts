// T-510 (finding F-15): rate limiting, MySQL-backed fixed-window counter.
//
// Deliberately not in-memory: DO App Platform instances restart/scale/redeploy
// independently, which would silently reset an in-memory counter to zero and
// defeat the limit. Not Redis-backed either (per the scoping decision) --
// reuses the existing production MySQL instance rather than adding new
// infrastructure. A fixed window is coarser than a sliding one but is exact,
// index-friendly, and sufficient for login/register/reset throttling.
import { db } from "./db";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

// windowSeconds should evenly bucket time (e.g. 60, 300, 900) so
// window_start is stable and the UNIQUE KEY upsert stays cheap.
export async function checkRateLimit(
  identifier: string,
  route: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / (windowSeconds * 1000)) * (windowSeconds * 1000);
  const windowStart = new Date(windowStartMs);

  // Upsert-and-read in one round trip: insert the window row if it's new,
  // otherwise bump attempt_count. VALUES()/alias syntax varies by MySQL
  // version; ON DUPLICATE KEY UPDATE with attempt_count=attempt_count+1 is
  // the portable form.
  await db().execute(
    `INSERT INTO rate_limit_attempts (identifier, route, window_start, attempt_count)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE attempt_count = attempt_count + 1`,
    [identifier, route, windowStart]
  );

  const [rows] = await db().execute<DatabaseRow[]>(
    "SELECT attempt_count FROM rate_limit_attempts WHERE identifier=? AND route=? AND window_start=? LIMIT 1",
    [identifier, route, windowStart]
  );
  const count = Number(rows[0]?.attempt_count || 0);

  // Best-effort cleanup of old windows for this identifier/route so the
  // table doesn't grow unbounded; failure here must never block the request.
  db()
    .execute("DELETE FROM rate_limit_attempts WHERE identifier=? AND route=? AND window_start<?", [
      identifier,
      route,
      new Date(windowStartMs - windowSeconds * 1000 * 10),
    ])
    .catch(() => {});

  if (count > maxAttempts) {
    const retryAfterSeconds = Math.ceil((windowStartMs + windowSeconds * 1000 - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

// Best-effort caller IP extraction behind DO App Platform's proxy.
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
