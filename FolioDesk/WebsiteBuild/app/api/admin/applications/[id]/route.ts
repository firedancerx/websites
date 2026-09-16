import { NextResponse } from "next/server";
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

  const [rows] = await db().execute<DatabaseRow[]>("SELECT user_id, status, affiliate_code FROM affiliate_applications WHERE id=?", [id]);
  if (!rows[0]) return NextResponse.redirect(new URL("/foliodesk/admin", getBaseUrl(req)), 303);

  const idDocUnclear = f.get("idDocUnclear") === "1" ? 1 : 0;
  const holdingIdUnaccepted = f.get("holdingIdUnaccepted") === "1" ? 1 : 0;
  const remarks = String(f.get("remarks") || "").trim();

  // T-403 (plan §7.3(3), §7.4): only the APPROVED transition requires Management
  // sign-off. The other eight transitions are reversible, non-financial, or
  // themselves protective actions (e.g. SUSPENDED, REJECTED) where a second
  // sign-off adds delay without a matching control benefit, so they proceed
  // exactly as before, unchanged, below this block.
  if (decision === "APPROVED") {
    const [existingRows] = await db().execute<any[]>(
      "SELECT id FROM maker_checker_requests WHERE entity_type='affiliate_applications' AND entity_id=? AND status='PENDING' LIMIT 1",
      [id]
    );
    if (existingRows.length > 0) {
      return NextResponse.redirect(
        new URL("/foliodesk/admin?error=A+Management+approval+request+for+this+application+is+already+pending", getBaseUrl(req)),
        303
      );
    }

    const decisionNote = remarks || "Recommended for approval by Admin, pending Management sign-off.";

    await db().execute(
      `UPDATE affiliate_applications SET 
        status='PENDING_MANAGEMENT_APPROVAL',
        assigned_reviewer_id=?,
        decision_note=?,
        flag_id_doc_unclear=?,
        flag_holding_id_unaccepted=?
      WHERE id=?`,
      [admin.id, decisionNote, idDocUnclear, holdingIdUnaccepted, id]
    );

    await db().execute(
      `INSERT INTO maker_checker_requests
        (request_type, entity_type, entity_id, action_payload, status, submitted_by)
       VALUES ('APPLICATION_APPROVAL', 'affiliate_applications', ?, ?, 'PENDING', ?)`,
      [id, JSON.stringify({ applicationId: Number(id), idDocUnclear, holdingIdUnaccepted, decisionNote }), admin.id]
    );

    await db().execute(
      "INSERT INTO application_status_history(application_id,from_status,to_status,changed_by,public_message) VALUES(?,?,?,?,?)",
      [id, rows[0].status, "PENDING_MANAGEMENT_APPROVAL", admin.id, "Submitted to Management for approval sign-off"]
    );

    await db().execute(
      "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'APPLICATION_APPROVAL_SUBMITTED','affiliate_application',?,JSON_OBJECT('from',?))",
      [admin.id, id, rows[0].status]
    );

    return NextResponse.redirect(
      new URL("/foliodesk/admin?success=Submitted+for+Management+approval.+The+affiliate+code+is+not+activated+until+a+Management+user+approves.", getBaseUrl(req)),
      303
    );
  }

  const targetUserId = rows[0].user_id;
  const defaultNote =
    decision === "CORRECTION_REQUIRED" || decision === "INFORMATION_REQUIRED"
      ? "FolioDesk requires additional corrections or information regarding your identity documents or profile details."
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
      decided_at=IF(? IN ('REJECTED','SUSPENDED','TERMINATED','RETRACTION_ACKNOWLEDGED'), NOW(), decided_at),
      decision_note=?,
      flag_id_doc_unclear=?,
      flag_holding_id_unaccepted=?
    WHERE id=?`,
    [decision, admin.id, decision, decisionNote, idDocUnclear, holdingIdUnaccepted, id]
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
    await db().execute("UPDATE users SET status=? WHERE id=?", [userStatus, targetUserId]);
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
