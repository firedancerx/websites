import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { hashPassword, getBaseUrl, revokeAllSessions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { validateCsrfFromForm } from "../../../lib/csrf";

// Step 2 of the forgot-password fix: consumes a single-use token issued by
// app/api/forgot-password/route.ts. Marks the token used immediately on a
// successful reset (and, defensively, even on some failure paths below) so
// it can never be replayed. Revokes every existing session for the account,
// same as a self-service password change (T-510) -- a password reset is a
// credential rotation regardless of which route triggered it.
export async function POST(req: Request) {
  const f = await req.formData();
  const token = String(f.get("token") || "");
  const newPassword = String(f.get("newPassword") || "");
  const confirmPassword = String(f.get("confirmPassword") || "");

  const resetPagePath = `/foliodesk/reset-password?token=${encodeURIComponent(token)}`;

  if (!(await validateCsrfFromForm(f))) {
    return NextResponse.redirect(
      new URL(`${resetPagePath}&error=Your+session+expired.+Please+try+again.`, getBaseUrl(req)),
      303
    );
  }

  if (!token) {
    return NextResponse.redirect(
      new URL("/foliodesk/forgot-password?error=Invalid+or+missing+reset+token", getBaseUrl(req)),
      303
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.redirect(
      new URL(`${resetPagePath}&error=Passwords+do+not+match`, getBaseUrl(req)),
      303
    );
  }

  if (newPassword.length < 12) {
    return NextResponse.redirect(
      new URL(`${resetPagePath}&error=Password+must+be+at+least+12+characters`, getBaseUrl(req)),
      303
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [rows] = await db().execute<DatabaseRow[]>(
    "SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash=? LIMIT 1",
    [tokenHash]
  );
  const reset = rows[0];

  if (!reset || reset.used_at || new Date(reset.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(
      new URL("/foliodesk/forgot-password?error=This+reset+link+is+invalid+or+has+expired.+Please+request+a+new+one.", getBaseUrl(req)),
      303
    );
  }

  const [userRows] = await db().execute<DatabaseRow[]>("SELECT status FROM users WHERE id=? LIMIT 1", [reset.user_id]);
  if (!userRows[0] || userRows[0].status === "SUSPENDED") {
    await db().execute("UPDATE password_resets SET used_at=NOW() WHERE id=?", [reset.id]);
    return NextResponse.redirect(
      new URL("/foliodesk/login?error=This+account+cannot+reset+its+password.+Please+contact+support.", getBaseUrl(req)),
      303
    );
  }

  const newHash = hashPassword(newPassword);
  await db().execute("UPDATE users SET password_hash=? WHERE id=?", [newHash, reset.user_id]);
  await db().execute("UPDATE password_resets SET used_at=NOW() WHERE id=?", [reset.id]);
  await revokeAllSessions(reset.user_id);
  await db().execute(
    "INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id) VALUES (?, 'PASSWORD_RESET', 'user', ?)",
    [reset.user_id, String(reset.user_id)]
  );

  return NextResponse.redirect(
    new URL(
      "/foliodesk/login?success=Password+reset+successfully.+Please+sign+in+with+your+new+password.",
      getBaseUrl(req)
    ),
    303
  );
}
