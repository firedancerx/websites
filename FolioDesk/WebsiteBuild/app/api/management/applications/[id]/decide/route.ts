import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireManagement, getBaseUrl } from "../../../../../../lib/auth";
import { db } from "../../../../../../lib/db";
import { validateCsrfFromForm } from "../../../../../../lib/csrf";

// T-403 (plan §7.3(3), §7.4, §7.6): Management's decision endpoint for an
// APPLICATION_APPROVAL request. MANAGEMENT-only.
//
// Approve: performs the actual APPROVED transition that used to happen
// directly in the Admin route -- generates the affiliate_code (if not
// already assigned, e.g. on a reinstatement), sets
// affiliate_applications.status='APPROVED', decided_at, and users.status='ACTIVE'
// + role='AFFILIATE'.
//
// Reject: per plan §7.3(3), "Management rejects -> application reverts to
// UNDER_REVIEW with the reason logged" -- this is a softer outcome than the
// Admin's own REJECTED decision (which is terminal); it sends the
// application back to the Admin review queue rather than rejecting the
// applicant outright, since Management's rejection here is a second-opinion
// disagreement with the Admin's recommendation, not a decision about the
// applicant themselves.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const management = await requireManagement();
  if (!management) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const { id } = await params;

  const f = await req.formData();
  const decision = String(f.get("decision") || "").toUpperCase(); // "APPROVE" | "REJECT"
  const decisionNotes = String(f.get("decisionNotes") || "").trim();

  // T-510 (F-15): CSRF synchronizer-token check. Must run before any mutation below.
  if (!(await validateCsrfFromForm(f, management.session_csrf_hash))) {
    return NextResponse.redirect(
      new URL(`/foliodesk/management/queue?error=Your+session+expired.+Please+try+again.`, getBaseUrl(req)),
      303
    );
  }

  try {
    const [reqRows] = await db().execute<any[]>(
      "SELECT * FROM maker_checker_requests WHERE entity_type='affiliate_applications' AND entity_id=? AND status='PENDING' LIMIT 1",
      [id]
    );
    const mcRequest = reqRows[0];
    if (!mcRequest) throw new Error("No pending Management approval request found for this application.");

    if (mcRequest.submitted_by === management.id) {
      throw new Error("Separation of duties violation: the submitting Admin cannot also act as the Management approver for the same request.");
    }

    if (decision !== "APPROVE" && decision !== "REJECT") {
      throw new Error("Invalid decision.");
    }

    const [appRows] = await db().execute<any[]>(
      "SELECT user_id, status, affiliate_code FROM affiliate_applications WHERE id=? LIMIT 1",
      [id]
    );
    const app = appRows[0];
    if (!app) throw new Error("Application not found.");
    if (app.status !== "PENDING_MANAGEMENT_APPROVAL") {
      throw new Error("This application is no longer awaiting Management approval.");
    }

    if (decision === "APPROVE") {
      const code = app.affiliate_code || `FD${randomBytes(4).toString("hex").toUpperCase()}`;

      await db().execute(
        `UPDATE affiliate_applications SET
          status='APPROVED',
          affiliate_code=?,
          decided_at=NOW()
        WHERE id=?`,
        [code, id]
      );

      if (app.user_id) {
        await db().execute("UPDATE users SET status='ACTIVE', role='AFFILIATE' WHERE id=?", [app.user_id]);
      }

      await db().execute(
        "INSERT INTO application_status_history(application_id,from_status,to_status,changed_by,public_message) VALUES(?,?,?,?,?)",
        [id, "PENDING_MANAGEMENT_APPROVAL", "APPROVED", management.id, decisionNotes || "Approved by Management. Affiliate code is now active."]
      );
    } else {
      await db().execute(
        `UPDATE affiliate_applications SET status='UNDER_REVIEW', decision_note=? WHERE id=?`,
        [decisionNotes || "Returned to Admin review by Management (approval not granted).", id]
      );

      await db().execute(
        "INSERT INTO application_status_history(application_id,from_status,to_status,changed_by,public_message) VALUES(?,?,?,?,?)",
        [id, "PENDING_MANAGEMENT_APPROVAL", "UNDER_REVIEW", management.id, decisionNotes || "Management did not grant approval; returned to review."]
      );
    }

    await db().execute(
      `UPDATE maker_checker_requests
       SET status=?, decided_by=?, decided_at=CURRENT_TIMESTAMP, decision_notes=?, is_immutable=1
       WHERE id=?`,
      [decision === "APPROVE" ? "APPROVED" : "REJECTED", management.id, decisionNotes || null, mcRequest.id]
    );

    await db().execute(
      "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'MAKER_CHECKER_DECISION','maker_checker_requests',?,JSON_OBJECT('requestType','APPLICATION_APPROVAL','decision',?,'applicationId',?))",
      [management.id, String(mcRequest.id), decision, String(id)]
    );

    return NextResponse.redirect(
      new URL(
        `/foliodesk/management/queue?success=Application+${decision === "APPROVE" ? "approved. Affiliate code is now active." : "returned to Admin review."}`,
        getBaseUrl(req)
      ),
      303
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/management/queue?error=${encodeURIComponent(err?.message || "Failed to decide on application approval request")}`,
        getBaseUrl(req)
      ),
      303
    );
  }
}
