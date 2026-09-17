import { NextResponse } from "next/server";
import { requireManagement, getBaseUrl } from "../../../../../../lib/auth";
import { db } from "../../../../../../lib/db";
import { approveDealCollection, rejectDealCollection } from "../../../../../../lib/funnel";
import { validateCsrfFromForm } from "../../../../../../lib/csrf";
import { errorMessage } from "../../../../../../lib/errors";

// T-401 (plan §7.3(1), §7.6): Management's decision endpoint for a
// COLLECTION_APPROVAL request. MANAGEMENT-only. Approves-as-submitted or
// rejects-with-reason -- cannot re-author the maker's proposed amounts,
// since approveDealCollection() re-derives everything from the underlying
// deal_collections row, not from anything Management supplies here.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const management = await requireManagement();
  if (!management) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const { id } = await params;
  const collectionId = Number(id);

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
      "SELECT * FROM maker_checker_requests WHERE entity_type='deal_collections' AND entity_id=? AND status='PENDING' LIMIT 1",
      [collectionId]
    );
    const mcRequest = reqRows[0];
    if (!mcRequest) throw new Error("No pending Management approval request found for this collection.");

    // Defense in depth alongside the DB-level chk_mc_separation CHECK constraint
    // (plan §7.2): the same person can never submit and decide the same request.
    if (mcRequest.submitted_by === management.id) {
      throw new Error("Separation of duties violation: the submitting Admin cannot also act as the Management approver for the same request.");
    }

    if (decision !== "APPROVE" && decision !== "REJECT") {
      throw new Error("Invalid decision.");
    }

    const payload = typeof mcRequest.action_payload === "string" ? JSON.parse(mcRequest.action_payload) : mcRequest.action_payload;

    let successMessage = decision === "APPROVE" ? "Collection approved. Payment Advice vouchers generated." : "Collection rejected.";

    if (decision === "APPROVE") {
      const { skippedBeneficiaries } = await approveDealCollection({
        collectionId,
        approverUserId: management.id,
        approvalRemarks: payload.approvalRemarks,
      });

      // F-04 (plan §8 item 2, business decision recorded 2026-09-16): surface
      // any beneficiary withheld by the "snapshot at collection approval"
      // vesting rule, so Management sees it immediately rather than having
      // to discover it later in audit_events.
      if (skippedBeneficiaries.length > 0) {
        const withheldSummary = skippedBeneficiaries
          .map((s) => `${s.affiliateLegalName} (${s.beneficiaryType}, status ${s.status})`)
          .join("; ");
        successMessage = `Collection approved. Payment Advice vouchers generated for eligible beneficiaries. Commission WITHHELD for: ${withheldSummary} -- not in APPROVED standing at time of approval.`;
      }
    } else {
      await rejectDealCollection({
        collectionId,
        approverUserId: management.id,
        approvalRemarks: decisionNotes || "Rejected by management.",
      });
    }

    await db().execute(
      `UPDATE maker_checker_requests
       SET status=?, decided_by=?, decided_at=CURRENT_TIMESTAMP, decision_notes=?, is_immutable=1
       WHERE id=?`,
      [decision === "APPROVE" ? "APPROVED" : "REJECTED", management.id, decisionNotes || null, mcRequest.id]
    );

    // T-408 (plan §7.6): audit trail entry per maker-checker decision, cross-referencing
    // maker_checker_requests.id, for consistency with the rest of the system's audit surface.
    await db().execute(
      "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'MAKER_CHECKER_DECISION','maker_checker_requests',?,JSON_OBJECT('requestType','COLLECTION_APPROVAL','decision',?,'collectionId',?))",
      [management.id, String(mcRequest.id), decision, String(collectionId)]
    );

    return NextResponse.redirect(
      new URL(
        `/foliodesk/management/queue?success=${encodeURIComponent(successMessage)}`,
        getBaseUrl(req)
      ),
      303
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/management/queue?error=${encodeURIComponent(errorMessage(err, "Failed to decide on collection approval request"))}`,
        getBaseUrl(req)
      ),
      303
    );
  }
}
