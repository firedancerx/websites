import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireAdmin, getBaseUrl } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";

const allowed = new Set([
  "UNDER_REVIEW",
  "INFORMATION_REQUIRED",
  "CORRECTION_REQUIRED",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "TERMINATED",
  "RETRACTED",
  "RETRACTION_ACKNOWLEDGED",
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);

  const { id } = await params;
  const f = await req.formData();
  const decision = String(f.get("decision"));
  if (!allowed.has(decision)) return NextResponse.redirect(new URL("/foliodesk/admin", getBaseUrl(req)), 303);

  const [rows] = await db().execute<any[]>("SELECT user_id, status, affiliate_code FROM affiliate_applications WHERE id=?", [id]);
  if (!rows[0]) return NextResponse.redirect(new URL("/foliodesk/admin", getBaseUrl(req)), 303);

  const targetUserId = rows[0].user_id;
  const idDocUnclear = f.get("idDocUnclear") === "1" ? 1 : 0;
  const holdingIdUnaccepted = f.get("holdingIdUnaccepted") === "1" ? 1 : 0;
  const remarks = String(f.get("remarks") || "").trim();

  const code = decision === "APPROVED" ? rows[0].affiliate_code || `FD${randomBytes(4).toString("hex").toUpperCase()}` : rows[0].affiliate_code;
  const defaultNote =
    decision === "CORRECTION_REQUIRED" || decision === "INFORMATION_REQUIRED"
      ? "FolioDesk requires additional corrections or information regarding your identity documents or profile details."
      : decision === "APPROVED"
      ? "Approved. Your affiliate code is now active."
      : decision === "SUSPENDED"
      ? "Your affiliate application/account has been suspended."
      : decision === "TERMINATED"
      ? "Your affiliate application/account has been terminated."
      : decision === "RETRACTION_ACKNOWLEDGED"
      ? "Retraction acknowledged by superadmin. Profile is in read-only mode, and historical commissions for introductions made while active remain honored."
      : decision === "RETRACTED"
      ? "Affiliateship retracted."
      : decision === "REJECTED"
      ? "The application was not approved at this time."
      : "Your application is under review.";

  const decisionNote = remarks || defaultNote;

  await db().execute(
    `UPDATE affiliate_applications SET 
      status=?,
      assigned_reviewer_id=?,
      affiliate_code=?,
      decided_at=IF(? IN ('APPROVED','REJECTED','SUSPENDED','TERMINATED','RETRACTION_ACKNOWLEDGED'), NOW(), decided_at),
      decision_note=?,
      flag_id_doc_unclear=?,
      flag_holding_id_unaccepted=?
    WHERE id=?`,
    [decision, admin.id, code, decision, decisionNote, idDocUnclear, holdingIdUnaccepted, id]
  );

  if (targetUserId) {
    // F-05 fix (plan §6.2 Finding 2, §7.8, §8 item 4): every decision string other
    // than the literal SUSPENDED/TERMINATED previously fell through to ACTIVE --
    // including RETRACTED and RETRACTION_ACKNOWLEDGED, which this endpoint's own
    // decision-note text above describes as "read-only mode". users.status must
    // reflect that read-only intent instead of silently reactivating the account.
    const userStatus =
      decision === "SUSPENDED" || decision === "TERMINATED"
        ? "SUSPENDED"
        : decision === "RETRACTED" || decision === "RETRACTION_ACKNOWLEDGED"
        ? "SUSPENDED"
        : "ACTIVE";
    if (decision === "APPROVED") {
      await db().execute("UPDATE users SET status=?, role='AFFILIATE' WHERE id=?", [userStatus, targetUserId]);
    } else {
      await db().execute("UPDATE users SET status=? WHERE id=?", [userStatus, targetUserId]);
    }
  }

  await db().execute(
    "INSERT INTO application_status_history(application_id,from_status,to_status,changed_by,public_message) VALUES(?,?,?,?,?)",
    [id, rows[0].status, decision, admin.id, `Status changed to ${decision}`]
  );

  await db().execute(
    "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'APPLICATION_STATUS_CHANGED','affiliate_application',?,JSON_OBJECT('from',?,'to',?))",
    [admin.id, id, rows[0].status, decision]
  );

  return NextResponse.redirect(new URL("/foliodesk/admin", getBaseUrl(req)), 303);
}
