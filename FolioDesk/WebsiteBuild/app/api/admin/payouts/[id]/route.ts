import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { validateCsrfFromForm } from "../../../../../lib/csrf";
import { errorMessage } from "../../../../../lib/errors";

// T-402 (plan §7.3(2)): SETTLE_PAYOUT no longer writes payout_status='PAID'
// directly. It submits a maker_checker_requests row capturing the exact
// payload (adviceIds, manualBankTxRef, payoutNotes) and leaves the advice at
// PENDING_DISBURSEMENT -- nothing is disbursed until a Management user
// decides via app/api/management/payouts/decide/route.ts.
//
// CANCEL_PAYOUT remains a direct Admin action (it is a protective/withholding
// action, not a disbursement -- it does not move money) but now carries the
// F-02 re-flip guard: it can only act on an advice still at
// PENDING_DISBURSEMENT, closing the "no guard against re-flipping an
// already-PAID/CANCELLED row" gap.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const { id } = await params;
  const adviceId = Number(id);

  const f = await req.formData();
  const action = String(f.get("action") || "SETTLE_PAYOUT");
  const manualBankTxRef = String(f.get("manualBankTxRef") || "").trim();
  const payoutNotes = String(f.get("payoutNotes") || "").trim();

  // T-510 (F-15): CSRF synchronizer-token check. Must run before any mutation below.
  if (!(await validateCsrfFromForm(f, admin.session_csrf_hash))) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/payouts?error=Your+session+expired.+Please+try+again.`, getBaseUrl(req)),
      303
    );
  }

  if (action === "SETTLE_PAYOUT") {
    if (!manualBankTxRef) {
      return NextResponse.redirect(
        new URL("/foliodesk/admin/payouts?error=Bank+transaction+reference+is+mandatory+for+recording+payout", getBaseUrl(req)),
        303
      );
    }

    try {
      const [adviceRows] = await db().execute<any[]>(
        "SELECT id, payout_status FROM payment_advices WHERE id=? LIMIT 1",
        [adviceId]
      );
      const advice = adviceRows[0];
      if (!advice) throw new Error("Payment advice not found.");
      if (advice.payout_status !== "PENDING_DISBURSEMENT") {
        throw new Error("This advice is not pending disbursement (already settled, cancelled, or does not exist in a pending state).");
      }

      const [existingRows] = await db().execute<any[]>(
        "SELECT id FROM maker_checker_requests WHERE entity_type='payment_advices' AND entity_id=? AND status='PENDING' LIMIT 1",
        [adviceId]
      );
      if (existingRows.length > 0) {
        throw new Error("A Management disbursement approval request for this advice is already pending. It cannot be submitted twice.");
      }

      await db().execute(
        `INSERT INTO maker_checker_requests
          (request_type, entity_type, entity_id, action_payload, status, submitted_by)
         VALUES ('PAYOUT_DISBURSEMENT', 'payment_advices', ?, ?, 'PENDING', ?)`,
        [
          adviceId,
          JSON.stringify({ mode: "single", adviceIds: [adviceId], manualBankTxRef, payoutNotes }),
          admin.id,
        ]
      );

      await db().execute(
        "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'PAYOUT_DISBURSEMENT_SUBMITTED','payment_advices',?,JSON_OBJECT('manualBankTxRef',?))",
        [admin.id, String(adviceId), manualBankTxRef]
      );

      return NextResponse.redirect(
        new URL(
          "/foliodesk/admin/payouts?success=Submitted+for+Management+disbursement+approval.+Funds+are+not+marked+PAID+until+a+Management+user+approves+this+request.",
          getBaseUrl(req)
        ),
        303
      );
    } catch (err: any) {
      return NextResponse.redirect(
        new URL(
          `/foliodesk/admin/payouts?error=${encodeURIComponent(errorMessage(err, "Failed to submit payout for Management approval"))}`,
          getBaseUrl(req)
        ),
        303
      );
    }
  }

  if (action === "CANCEL_PAYOUT") {
    // F-02 fix: guard against re-flipping an already-PAID or already-CANCELLED advice.
    const [result]: any = await db().execute(
      "UPDATE payment_advices SET payout_status='CANCELLED', payout_notes=? WHERE id=? AND payout_status='PENDING_DISBURSEMENT'",
      [payoutNotes || "Cancelled by admin", adviceId]
    );
    if (!result || result.affectedRows === 0) {
      return NextResponse.redirect(
        new URL("/foliodesk/admin/payouts?error=This+advice+is+not+pending+disbursement+and+cannot+be+cancelled", getBaseUrl(req)),
        303
      );
    }
    return NextResponse.redirect(
      new URL("/foliodesk/admin/payouts?success=Payment+advice+cancelled", getBaseUrl(req)),
      303
    );
  }

  return NextResponse.redirect(new URL("/foliodesk/admin/payouts", getBaseUrl(req)), 303);
}
