import { NextResponse } from "next/server";
import { requireManagement, getBaseUrl } from "../../../../../../../lib/auth";
import { db } from "../../../../../../../lib/db";
import { adjudicateDealAppeal } from "../../../../../../../lib/funnel";

// T-404 (plan §7.3(4), §7.6, §7.8): Management's decision endpoint for a
// CLOSURE_APPEAL_ADJUDICATION request. MANAGEMENT-only.
//
// Approve (of the Admin's recommendation): executes adjudicateDealAppeal()
// with the exact payload the Admin submitted (isApproved, daysExtended,
// notes) -- Management confirms-as-submitted, it cannot silently change the
// days or override the recommendation from here. Because F-08 was fixed
// (lib/funnel.ts, deal_pipeline.status_before_force_closure), an approval
// restores the deal's true pre-closure stage rather than a hardcoded one;
// this endpoint reports that restored stage back in the redirect so
// Management can see what actually happened, not just that "something" did.
//
// Reject (of the Admin's recommendation): Management disagrees with the
// Admin's proposed decision. adjudicateDealAppeal() is NOT called -- the
// deal's appeal_status is left untouched at APPEAL_SUBMITTED so the appeal
// remains open for the Admin to review again (e.g. resubmit a different
// recommendation), rather than this endpoint unilaterally deciding the
// opposite of what was asked.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const management = await requireManagement();
  if (!management) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const { id } = await params;
  const dealId = Number(id);

  const f = await req.formData();
  const decision = String(f.get("decision") || "").toUpperCase(); // "APPROVE" | "REJECT"
  const decisionNotes = String(f.get("decisionNotes") || "").trim();

  try {
    const [reqRows] = await db().execute<any[]>(
      "SELECT * FROM maker_checker_requests WHERE entity_type='deal_pipeline' AND entity_id=? AND request_type='CLOSURE_APPEAL_ADJUDICATION' AND status='PENDING' LIMIT 1",
      [dealId]
    );
    const mcRequest = reqRows[0];
    if (!mcRequest) throw new Error("No pending appeal adjudication request found for this deal.");

    if (mcRequest.submitted_by === management.id) {
      throw new Error("Separation of duties violation: the submitting Admin cannot also act as the Management approver for the same request.");
    }

    if (decision !== "APPROVE" && decision !== "REJECT") {
      throw new Error("Invalid decision.");
    }

    const payload = typeof mcRequest.action_payload === "string" ? JSON.parse(mcRequest.action_payload) : mcRequest.action_payload;
    let resultMessage = "Adjudication request rejected by Management. The appeal remains open for Admin review.";

    if (decision === "APPROVE") {
      await adjudicateDealAppeal({
        dealId,
        isApproved: payload.isApproved,
        daysExtended: payload.daysExtended,
        notes: payload.notes,
        adminUserId: management.id,
      });

      const [dealRows] = await db().execute<any[]>(
        "SELECT status FROM deal_pipeline WHERE id=? LIMIT 1",
        [dealId]
      );
      const finalStatus = dealRows[0]?.status;
      resultMessage = payload.isApproved
        ? `Appeal approved. Deal restored to ${finalStatus} with ${payload.daysExtended} extension day(s).`
        : "Appeal rejected. Deal remains force-closed (ABORTED).";
    }

    await db().execute(
      `UPDATE maker_checker_requests
       SET status=?, decided_by=?, decided_at=CURRENT_TIMESTAMP, decision_notes=?, is_immutable=1
       WHERE id=?`,
      [decision === "APPROVE" ? "APPROVED" : "REJECTED", management.id, decisionNotes || null, mcRequest.id]
    );

    await db().execute(
      "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'MAKER_CHECKER_DECISION','maker_checker_requests',?,JSON_OBJECT('requestType','CLOSURE_APPEAL_ADJUDICATION','decision',?,'dealId',?))",
      [management.id, String(mcRequest.id), decision, String(dealId)]
    );

    return NextResponse.redirect(
      new URL(`/foliodesk/management/queue?success=${encodeURIComponent(resultMessage)}`, getBaseUrl(req)),
      303
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/management/queue?error=${encodeURIComponent(err?.message || "Failed to decide on appeal adjudication request")}`,
        getBaseUrl(req)
      ),
      303
    );
  }
}
