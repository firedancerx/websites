import { NextResponse } from "next/server";
import { hashPassword, getBaseUrl } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
  const f = await req.formData();
  const email = String(f.get("email") || "").trim().toLowerCase();
  const newPassword = String(f.get("newPassword") || "");
  const confirmPassword = String(f.get("confirmPassword") || "");

  const forgotPasswordPath = "/foliodesk/forgot-password";

  if (!email || !email.includes("@")) {
    return NextResponse.redirect(
      new URL(`${forgotPasswordPath}?error=Please+enter+a+valid+email+address`, getBaseUrl(req)),
      303
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.redirect(
      new URL(`${forgotPasswordPath}?error=Passwords+do+not+match`, getBaseUrl(req)),
      303
    );
  }

  if (newPassword.length < 12) {
    return NextResponse.redirect(
      new URL(`${forgotPasswordPath}?error=Password+must+be+at+least+12+characters`, getBaseUrl(req)),
      303
    );
  }

  const [rows] = await db().execute<DatabaseRow[]>(
    "SELECT id, status FROM users WHERE email=? LIMIT 1",
    [email]
  );
  const u = rows[0];

  if (!u) {
    return NextResponse.redirect(
      new URL(`${forgotPasswordPath}?error=No+account+found+with+that+email+address`, getBaseUrl(req)),
      303
    );
  }

  if (u.status === "SUSPENDED") {
    return NextResponse.redirect(
      new URL(`${forgotPasswordPath}?error=This+account+is+suspended.+Please+contact+support.`, getBaseUrl(req)),
      303
    );
  }

  const newHash = hashPassword(newPassword);
  await db().execute("UPDATE users SET password_hash=? WHERE id=?", [newHash, u.id]);

  // Invalidate previous sessions upon password reset for security
  await db().execute("DELETE FROM sessions WHERE user_id=?", [u.id]);

  await db().execute(
    "INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id) VALUES (?, 'PASSWORD_RESET', 'user', ?)",
    [u.id, String(u.id)]
  );

  return NextResponse.redirect(
    new URL("/foliodesk/login?error=&registered=&success=Password+reset+successfully.+Please+sign+in+with+your+new+password.", getBaseUrl(req)),
    303
  );
}
