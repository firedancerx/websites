import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { getBaseUrl } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { validateCsrfFromForm } from "../../../lib/csrf";
import { checkRateLimit, getClientIp } from "../../../lib/rate-limit";
import { sendEmail } from "../../../lib/mailer";

// T-510 follow-on fix (new finding, not one of the original three T-510
// items): this route previously took an email + new password directly with
// zero identity verification -- anyone who knew a user's email could take
// over their account. It now only issues a single-use, 30-minute reset
// token by email (see lib/mailer.ts); the actual password change happens in
// app/api/reset-password/route.ts once the token is presented back.
//
// Deliberately does not reveal whether an account exists for the submitted
// email (same generic success message either way) -- the previous version's
// "No account found with that email address" response let anyone enumerate
// registered emails.
const RESET_MAX_ATTEMPTS = 5;
const RESET_WINDOW_SECONDS = 900;
const RESET_TOKEN_TTL_MINUTES = 30;

export async function POST(req: Request) {
  const f = await req.formData();
  const email = String(f.get("email") || "").trim().toLowerCase();
  const forgotPasswordPath = "/foliodesk/forgot-password";
  const genericSuccess = `${forgotPasswordPath}?success=${encodeURIComponent(
    "If an account exists for that email address, a password reset link has been sent. It expires in 30 minutes."
  )}`;

  if (!(await validateCsrfFromForm(f))) {
    return NextResponse.redirect(
      new URL(`${forgotPasswordPath}?error=Your+session+expired.+Please+try+again.`, getBaseUrl(req)),
      303
    );
  }

  if (!email || !email.includes("@")) {
    return NextResponse.redirect(
      new URL(`${forgotPasswordPath}?error=Please+enter+a+valid+email+address`, getBaseUrl(req)),
      303
    );
  }

  const ip = getClientIp(req);
  const ipLimit = await checkRateLimit(ip, "forgot-password", RESET_MAX_ATTEMPTS, RESET_WINDOW_SECONDS);
  const pairLimit = await checkRateLimit(`${ip}:${email}`, "forgot-password", RESET_MAX_ATTEMPTS, RESET_WINDOW_SECONDS);
  if (!ipLimit.allowed || !pairLimit.allowed) {
    return NextResponse.redirect(
      new URL(`${forgotPasswordPath}?error=Too+many+requests.+Please+wait+a+few+minutes+and+try+again.`, getBaseUrl(req)),
      303
    );
  }

  const [rows] = await db().execute<DatabaseRow[]>(
    "SELECT id, status FROM users WHERE email=? LIMIT 1",
    [email]
  );
  const u = rows[0];

  // Same redirect whether or not the account exists or is suspended --
  // don't let this endpoint be used to enumerate accounts or their status.
  if (u && u.status !== "SUSPENDED") {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await db().execute(
      "INSERT INTO password_resets (user_id, token_hash, expires_at, requested_ip) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?)",
      [u.id, tokenHash, RESET_TOKEN_TTL_MINUTES, ip]
    );
    await db().execute(
      "INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id) VALUES (?, 'PASSWORD_RESET_REQUESTED', 'user', ?)",
      [u.id, String(u.id)]
    );

    const resetUrl = new URL(`/foliodesk/reset-password?token=${token}`, getBaseUrl(req)).toString();
    await sendEmail({
      to: email,
      subject: "Reset your FolioDesk password",
      text: `We received a request to reset your FolioDesk password.\n\nReset your password: ${resetUrl}\n\nThis link expires in ${RESET_TOKEN_TTL_MINUTES} minutes. If you did not request this, you can safely ignore this email -- your password has not been changed.`,
      html: `<p>We received a request to reset your FolioDesk password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes. If you did not request this, you can safely ignore this email -- your password has not been changed.</p>`,
    });
  }

  return NextResponse.redirect(new URL(genericSuccess, getBaseUrl(req)), 303);
}
