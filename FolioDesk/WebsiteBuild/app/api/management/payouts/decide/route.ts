import { NextResponse } from "next/server";
import { requireManagement, getBaseUrl } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { settleConsolidatedPayout } from "../../../../../lib/funnel";
import { validateCsrfFromForm } from "../../../../../lib/csrf";
import { errorMessage } from "../../../../../lib/errors";

// T-402 (plan §7.3(2), §7.6): Management's decision endpoint for a
// PAYOUT_DISBURSEMENT request -- single-advice or consolidated batch (both
// funnel through the same maker_checker_requests row shape, disambiguated
// by action_payload.mode). Approves-as-submitted (executes the maker's
// original payload exactly) or rejects-with-reason; cannot re-author
// amounts, bank references, or which advices are included.
//
// Takes the maker_checker_requests id directly in the form body (rather than
// an [id] route segment) because a single request here can represent either
// entity_type='payment_advices' (single) or entity_type='affiliate_batch'
// (batch) -- there is no one natural URL id shared by both.

export async function POST(req: Request) {
  const management = await requireManagement();
  if (!management) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const f = await req.formData();
  const requestId = Number(f.get("requestId"));
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
      "SELECT * FROM maker_checker_requests WHERE id=? AND request_type='PAYOUT_DISBURSEMENT' AND status='PENDING' LIMIT 1",
      [requestId]
    );
    const mcRequest = reqRows[0];
    if (!mcRequest) throw new Error("No pending payout disbursement request found.");

    // Defense in depth alongside the DB-level chk_mc_separation CHECK constraint (plan §7.2).
    if (mcRequest.submitted_by === management.id) {
      throw new Error("Separation of duties violation: the submitting Admin cannot also act as the Management approver for the same request.");
    }

    if (decision !== "APPROVE" && decision !== "REJECT") {
      throw new Error("Invalid decision.");
    }

    const payload = typeof mcRequest.action_payload === "string" ? JSON.parse(mcRequest.action_payload) : mcRequest.action_payload;

    if (decision === "APPROVE") {
      if (payload.mode === "batch") {
        await settleConsolidatedPayout({
          beneficiaryAffiliateId: payload.beneficiaryAffiliateId,
          adviceIds: payload.adviceIds,
          manualBankTxRef: payload.manualBankTxRef,
          bankName: payload.bankName || undefined,
          bankAccountNumber: payload.bankAccountNumber || undefined,
          payoutNotes: payload.payoutNotes || undefined,
          disbursedByUserId: management.id,
        });
      } else {
        // Single-advice settlement. F-02 fix: only settle an advice still at
        // PENDING_DISBURSEMENT -- the same re-flip guard applied to CANCEL_PAYOUT
        // in app/api/admin/payouts/[id]/route.ts, now also covering the PAID path.
        const adviceId = payload.adviceIds[0];
        const [result]: any = await db().execute(
          `UPDATE payment_advices
           SET payout_status='PAID',
               paid_at=CURRENT_TIMESTAMP,
               manual_bank_tx_ref=?,
               payout_notes=?
           WHERE id=? AND payout_status='PENDING_DISBURSEMENT'`,
          [payload.manualBankTxRef, payload.payoutNotes || null, adviceId]
        );
        if (!result || result.affectedRows === 0) {
          throw new Error("This advice is no longer pending disbursement (already settled or cancelled since submission).");
        }
      }
    }
    // REJECT: the underlying payment_advices row(s) are left untouched at
    // PENDING_DISBURSEMENT (rejection withholds disbursement, it does not cancel
    // the commission entitlement -- CANCEL_PAYOUT remains the separate, more
    // drastic admin action for that).

    await db().execute(
      `UPDATE maker_checker_requests
       SET status=?, decided_by=?, decided_at=CURRENT_TIMESTAMP, decision_notes=?, is_immutable=1
       WHERE id=?`,
      [decision === "APPROVE" ? "APPROVED" : "REJECTED", management.id, decisionNotes || null, mcRequest.id]
    );

    await db().execute(
      "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'MAKER_CHECKER_DECISION','maker_checker_requests',?,JSON_OBJECT('requestType','PAYOUT_DISBURSEMENT','decision',?,'mode',?))",
      [management.id, String(mcRequest.id), decision, payload.mode || "single"]
    );

    return NextResponse.redirect(
      new URL(
        `/foliodesk/management/queue?success=Payout+${decision === "APPROVE" ? "disbursed and marked PAID." : "disbursement rejected. Advice(s) remain pending."}`,
        getBaseUrl(req)
      ),
      303
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/management/queue?error=${encodeURIComponent(errorMessage(err, "Failed to decide on payout disbursement request"))}`,
        getBaseUrl(req)
      ),
      303
    );
  }
}
