import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";

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

  if (action === "SETTLE_PAYOUT") {
    if (!manualBankTxRef) {
      return NextResponse.redirect(
        new URL("/foliodesk/admin/payouts?error=Bank+transaction+reference+is+mandatory+for+recording+payout", getBaseUrl(req)),
        303
      );
    }

    await db().execute(
      `UPDATE payment_advices 
       SET payout_status='PAID', 
           paid_at=CURRENT_TIMESTAMP, 
           manual_bank_tx_ref=?, 
           payout_notes=? 
       WHERE id=?`,
      [manualBankTxRef, payoutNotes || null, adviceId]
    );

    return NextResponse.redirect(
      new URL("/foliodesk/admin/payouts?success=Payment+advice+voucher+marked+as+PAID+and+settlement+proof+recorded+successfully", getBaseUrl(req)),
      303
    );
  }

  if (action === "CANCEL_PAYOUT") {
    await db().execute(
      "UPDATE payment_advices SET payout_status='CANCELLED', payout_notes=? WHERE id=?",
      [payoutNotes || "Cancelled by admin", adviceId]
    );
    return NextResponse.redirect(
      new URL("/foliodesk/admin/payouts?success=Payment+advice+cancelled", getBaseUrl(req)),
      303
    );
  }

  return NextResponse.redirect(new URL("/foliodesk/admin/payouts", getBaseUrl(req)), 303);
}
