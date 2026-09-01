import { NextResponse } from "next/server";
import { currentUser, verifyPassword, hashPassword, getBaseUrl } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const f = await req.formData();
  const currentPassword = String(f.get("currentPassword") || "");
  const newPassword = String(f.get("newPassword") || "");
  const confirmPassword = String(f.get("confirmPassword") || "");

  const redirectPath = user.role === "ADMIN" ? "/foliodesk/admin" : "/foliodesk/portal";
  const changePasswordPagePath = "/foliodesk/portal/change-password";

  if (newPassword !== confirmPassword) {
    return NextResponse.redirect(
      new URL(`${changePasswordPagePath}?error=New+passwords+do+not+match`, getBaseUrl(req)),
      303
    );
  }

  if (newPassword.length < 12) {
    return NextResponse.redirect(
      new URL(`${changePasswordPagePath}?error=New+password+must+be+at+least+12+characters`, getBaseUrl(req)),
      303
    );
  }

  const [rows] = await db().execute<any[]>("SELECT password_hash FROM users WHERE id=? LIMIT 1", [user.id]);
  const storedHash = rows[0]?.password_hash;

  if (!storedHash || !verifyPassword(currentPassword, storedHash)) {
    return NextResponse.redirect(
      new URL(`${changePasswordPagePath}?error=Current+password+is+incorrect`, getBaseUrl(req)),
      303
    );
  }

  const newHash = hashPassword(newPassword);
  await db().execute("UPDATE users SET password_hash=? WHERE id=?", [newHash, user.id]);
  await db().execute(
    "INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id) VALUES (?, 'PASSWORD_CHANGED', 'user', ?)",
    [user.id, String(user.id)]
  );

  return NextResponse.redirect(
    new URL(`${redirectPath}?success=Password+changed+successfully`, getBaseUrl(req)),
    303
  );
}
