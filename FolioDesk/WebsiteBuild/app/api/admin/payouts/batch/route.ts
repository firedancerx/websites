import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../lib/auth";
import { settleConsolidatedPayout } from "../../../../../lib/funnel";
import { errorMessage } from "../../../../../lib/errors";

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

  if (!affiliateId || !manualBankTxRef) {
    return NextResponse.redirect(
      new URL("/foliodesk/admin/payouts?error=Affiliate+and+bank+transaction+reference+are+mandatory", getBaseUrl(req)),
      303
    );
  }

  try {
    const { batchCode, totalAmount, adviceCount } = await settleConsolidatedPayout({
      beneficiaryAffiliateId: affiliateId,
      manualBankTxRef,
      bankName,
      bankAccountNumber,
      payoutNotes,
      disbursedByUserId: admin.id,
    });

    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/payouts?tab=batches&success=Consolidated+payout+voucher+${batchCode}+settled+successfully.+Disbursed+RM+${totalAmount.toFixed(2)}+across+${adviceCount}+payment+advice(s).`,
        getBaseUrl(req)
      ),
      303
    );
  } catch (err) {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/payouts?error=${encodeURIComponent(errorMessage(err, "Failed to settle consolidated payout"))}`,
        getBaseUrl(req)
      ),
      303
    );
  }
}
