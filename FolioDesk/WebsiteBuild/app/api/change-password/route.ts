import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser, verifyPassword, hashPassword, getBaseUrl, revokeAllSessions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { validateCsrfFromForm } from "../../../lib/csrf";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const f = await req.formData();
  const currentPassword = String(f.get("currentPassword") || "");
  const newPassword = String(f.get("newPassword") || "");
  const confirmPassword = String(f.get("confirmPassword") || "");

  const changePasswordPagePath = "/foliodesk/portal/change-password";

  if (!(await validateCsrfFromForm(f, user.session_csrf_hash))) {
    return NextResponse.redirect(
      new URL(`${changePasswordPagePath}?error=Your+session+expired.+Please+try+again.`, getBaseUrl(req)),
      303
    );
  }

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

  const [rows] = await db().execute<DatabaseRow[]>("SELECT password_hash FROM users WHERE id=? LIMIT 1", [user.id]);
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

  // T-510 (F-15, scoping decision: "all sessions everywhere"): a password
  // change invalidates every session for this user, including the one that
  // just made the change -- the requester is signed out here too and must
  // log back in with the new password, same as every other device.
  await revokeAllSessions(user.id);
  (await cookies()).delete("fd_session");

  return NextResponse.redirect(
    new URL("/foliodesk/login?success=Password+changed.+Please+sign+in+again+with+your+new+password.", getBaseUrl(req)),
    303
  );
}
