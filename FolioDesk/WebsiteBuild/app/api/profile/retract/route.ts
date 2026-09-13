import { NextResponse } from "next/server";
import { currentUser, getBaseUrl } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const [apps] = await db().execute<DatabaseRow[]>(
    "SELECT * FROM affiliate_applications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1",
    [user.id]
  );
  const app = apps[0];

  if (!app) {
    return NextResponse.redirect(
      new URL("/foliodesk/portal?error=No+affiliate+application+found", getBaseUrl(req)),
      303
    );
  }

  if (app.status === "RETRACTED" || app.status === "RETRACTION_ACKNOWLEDGED") {
    return NextResponse.redirect(
      new URL("/foliodesk/portal?error=Affiliateship+is+already+retracted", getBaseUrl(req)),
      303
    );
  }

  const prevStatus = app.status;

  // Set status immediately to RETRACTED (self-service, no approval required)
  await db().execute(
    `UPDATE affiliate_applications SET 
      status='RETRACTED',
      decided_at=NOW(),
      decision_note=IF(decision_note IS NULL OR decision_note='', 'Affiliateship retracted by partner.', CONCAT(decision_note, ' | Retracted by partner.'))
    WHERE id=?`,
    [app.id]
  );

  // Record status history
  await db().execute(
    "INSERT INTO application_status_history (application_id, from_status, to_status, changed_by, public_message) VALUES (?, ?, 'RETRACTED', ?, 'Affiliateship retracted by partner.')",
    [app.id, prevStatus, user.id]
  );

  // Record audit log
  await db().execute(
    "INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id, event_data) VALUES (?, 'AFFILIATE_RETRACTED', 'affiliate_application', ?, JSON_OBJECT('from', ?, 'to', 'RETRACTED'))",
    [user.id, String(app.id), prevStatus]
  );

  return NextResponse.redirect(
    new URL("/foliodesk/portal?success=Your+affiliateship+has+been+retracted.+Profile+is+now+in+read-only+mode.", getBaseUrl(req)),
    303
  );
}
