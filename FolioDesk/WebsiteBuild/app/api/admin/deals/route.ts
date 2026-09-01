import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { generateDealCode } from "../../../../lib/funnel";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const f = await req.formData();
  const action = String(f.get("action") || "");
  const dealId = f.get("dealId") ? Number(f.get("dealId")) : null;

  if (action === "CREATE_DEAL") {
    const affiliateId = Number(f.get("affiliateId"));
    const customerName = String(f.get("customerName") || "").trim();
    const customerEmail = String(f.get("customerEmail") || "").trim().toLowerCase();
    const customerPhone = String(f.get("customerPhone") || "").trim() || null;
    const packageName = String(f.get("packageName") || "FolioDesk Cloud Enterprise").trim();
    const packageCount = Number(f.get("packageCount") || 1);
    const contractValueMyr = parseFloat(String(f.get("contractValueMyr") || "60000.00"));
    const initialStatus = String(f.get("status") || "LEAD_SUBMITTED");
    const statusNote = String(f.get("statusNote") || "").trim() || null;

    if (!affiliateId || !customerName || !customerEmail || isNaN(contractValueMyr)) {
      return NextResponse.redirect(
        new URL("/foliodesk/admin/deals?error=Please+fill+in+all+mandatory+deal+fields", getBaseUrl(req)),
        303
      );
    }

    const dealCode = generateDealCode();
    await db().execute(
      `INSERT INTO deal_pipeline 
        (affiliate_id, deal_code, customer_name, customer_email, customer_phone, package_name, package_count, contract_value_myr, status, status_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        affiliateId,
        dealCode,
        customerName,
        customerEmail,
        customerPhone,
        packageName,
        packageCount,
        contractValueMyr,
        initialStatus,
        statusNote,
      ]
    );

    return NextResponse.redirect(
      new URL("/foliodesk/admin/deals?success=Deal+introduced+successfully", getBaseUrl(req)),
      303
    );
  }

  if (action === "UPDATE_STATUS" && dealId) {
    const targetStatus = String(f.get("targetStatus") || "");
    const statusNote = String(f.get("statusNote") || "").trim() || null;
    const suspendedReason = String(f.get("suspendedReason") || "").trim() || null;
    const abortedReason = String(f.get("abortedReason") || "").trim() || null;
    const invoiceNumber = String(f.get("invoiceNumber") || "").trim() || null;
    const signedDate = String(f.get("signedDate") || "").trim() || null;

    if (targetStatus === "SUSPENDED_EFFORT" && !suspendedReason) {
      return NextResponse.redirect(
        new URL("/foliodesk/admin/deals?error=Reason+for+suspension+of+efforts+is+required", getBaseUrl(req)),
        303
      );
    }

    if (targetStatus === "ABORTED" && !abortedReason) {
      return NextResponse.redirect(
        new URL("/foliodesk/admin/deals?error=Reason+for+aborting+opportunity+is+required", getBaseUrl(req)),
        303
      );
    }

    let query = "UPDATE deal_pipeline SET status=?, status_note=COALESCE(?, status_note)";
    const params: any[] = [targetStatus, statusNote];

    if (targetStatus === "SUSPENDED_EFFORT") {
      query += ", suspended_reason=?";
      params.push(suspendedReason);
    } else if (targetStatus === "ABORTED") {
      query += ", aborted_reason=?";
      params.push(abortedReason);
    } else if (targetStatus === "CONTRACT_SIGNED") {
      query += ", signed_date=COALESCE(?, CURDATE())";
      params.push(signedDate || null);
    } else if (targetStatus === "INVOICED") {
      query += ", invoice_number=?, invoiced_at=CURRENT_TIMESTAMP";
      params.push(invoiceNumber);
    }

    query += " WHERE id=?";
    params.push(dealId);

    await db().execute(query, params);

    return NextResponse.redirect(
      new URL("/foliodesk/admin/deals?success=Deal+status+updated+successfully", getBaseUrl(req)),
      303
    );
  }

  return NextResponse.redirect(new URL("/foliodesk/admin/deals", getBaseUrl(req)), 303);
}
