import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { validateCsrfFromForm } from "../../../../../lib/csrf";
import { errorMessage } from "../../../../../lib/errors";

// T-402 (plan §7.3(2)): batch disbursement no longer calls
// settleConsolidatedPayout() directly. It snapshots the exact set of
// PENDING_DISBURSEMENT advice IDs for the affiliate at submission time and
// submits a maker_checker_requests row; nothing is disbursed until a
// Management user approves via app/api/management/payouts/decide/route.ts,
// which then executes settleConsolidatedPayout() with that exact snapshot
// (Management approves-as-submitted, cannot re-author amounts).

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const f = await req.formData();
  const affiliateId = Number(f.get("affiliateId"));
  const manualBankTxRef = String(f.get("manualBankTxRef") || "").trim();
  const bankName = String(f.get("bankName") || "").trim();
  const bankAccountNumber = String(f.get("bankAccountNumber") || "").trim();
  const payoutNotes = String(f.get("payoutNotes") || "").trim();

  // T-510 (F-15): CSRF synchronizer-token check. Must run before any mutation below.
  if (!(await validateCsrfFromForm(f, admin.session_csrf_hash))) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/payouts?error=Your+session+expired.+Please+try+again.`, getBaseUrl(req)),
      303
    );
  }

  if (!affiliateId || !manualBankTxRef) {
    return NextResponse.redirect(
      new URL("/foliodesk/admin/payouts?error=Affiliate+and+bank+transaction+reference+are+mandatory", getBaseUrl(req)),
      303
    );
  }

  try {
    const [advices] = await db().execute<any[]>(
      "SELECT id FROM payment_advices WHERE beneficiary_affiliate_id=? AND payout_status='PENDING_DISBURSEMENT'",
      [affiliateId]
    );
    if (advices.length === 0) {
      throw new Error("No pending payment advices found to disburse for this affiliate.");
    }
    const adviceIds = advices.map((a) => a.id);

    await db().execute(
      `INSERT INTO maker_checker_requests
        (request_type, entity_type, entity_id, action_payload, status, submitted_by)
       VALUES ('PAYOUT_DISBURSEMENT', 'affiliate_batch', ?, ?, 'PENDING', ?)`,
      [
        affiliateId,
        JSON.stringify({ mode: "batch", beneficiaryAffiliateId: affiliateId, adviceIds, manualBankTxRef, bankName, bankAccountNumber, payoutNotes }),
        admin.id,
      ]
    );

    await db().execute(
      "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'PAYOUT_BATCH_DISBURSEMENT_SUBMITTED','affiliate_batch',?,JSON_OBJECT('adviceCount',?,'manualBankTxRef',?))",
      [admin.id, String(affiliateId), adviceIds.length, manualBankTxRef]
    );

    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/payouts?tab=batches&success=Submitted+consolidated+payout+for+Management+approval+(${adviceIds.length}+advice(s)).+Funds+are+not+disbursed+until+approved.`,
        getBaseUrl(req)
      ),
      303
    );
  } catch (err) {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/payouts?error=${encodeURIComponent(errorMessage(err, "Failed to submit consolidated payout for Management approval"))}`,
        getBaseUrl(req)
      ),
      303
    );
  }
}
