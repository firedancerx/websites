import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { generateDealCode } from "../../../../lib/funnel";
import { isValidEmail, isValidPhone } from "../../../../lib/validation";

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
    const packageCount = Math.max(1, Number(f.get("packageCount") || 1));
    const contractValueMyr = parseFloat(String(f.get("contractValueMyr") || "60000.00"));
    const initialStatus = String(f.get("status") || "LEAD_SUBMITTED");
    const statusNote = String(f.get("statusNote") || "").trim() || null;
    const isTest = f.has("isTest") ? (f.get("isTest") === "1" || f.get("isTest") === "on" ? 1 : 0) : 1;

    if (!affiliateId || !customerName || !customerEmail || isNaN(contractValueMyr)) {
      return NextResponse.redirect(
        new URL("/foliodesk/admin/deals?error=Please+fill+in+all+mandatory+deal+fields", getBaseUrl(req)),
        303
      );
    }

    if (!isValidEmail(customerEmail)) {
      return NextResponse.redirect(
        new URL("/foliodesk/admin/deals?error=Invalid+email+format.+Please+enter+a+valid+email+address.", getBaseUrl(req)),
        303
      );
    }

    if (customerPhone && !isValidPhone(customerPhone)) {
      return NextResponse.redirect(
        new URL("/foliodesk/admin/deals?error=Invalid+phone+number+format.+Phone+numbers+cannot+contain+letters.", getBaseUrl(req)),
        303
      );
    }

    const dealCode = generateDealCode();
    const [res]: any = await db().execute(
      `INSERT INTO deal_pipeline 
        (affiliate_id, deal_code, customer_name, customer_email, customer_phone, package_name, package_count, contract_value_myr, status, status_note, is_test)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        isTest,
      ]
    );

    // Auto-insert acknowledged funnel step
    await db().execute(
      `INSERT INTO deal_funnel_steps 
        (deal_id, from_stage, to_stage, step_title, affiliate_notes, submitted_by_user_id, admin_review_status, admin_remarks, reviewed_by_user_id, reviewed_at, is_immutable, is_test)
       VALUES (?, null, ?, '1. Prospect Introduced by Administrator', ?, ?, 'ACKNOWLEDGED', 'Created and verified by administrator', ?, CURRENT_TIMESTAMP, 1, ?)`,
      [
        res.insertId,
        initialStatus,
        statusNote || "Initial commercial deal introduced by admin.",
        admin.id,
        admin.id,
        isTest,
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
    const invoiceTarget = String(f.get("invoiceTarget") || "PROSPECT").toUpperCase() === "AFFILIATE" ? "AFFILIATE" : "PROSPECT";
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

    const [existingRows] = await db().execute<any[]>("SELECT invoice_number, status FROM deal_pipeline WHERE id=? LIMIT 1", [dealId]);
    const existingDeal = existingRows[0] || null;
    const isReissuance = existingDeal?.invoice_number && existingDeal.invoice_number !== invoiceNumber;

    let query = "UPDATE deal_pipeline SET status=?, status_note=COALESCE(?, status_note), invoice_target=?";
    const params: any[] = [targetStatus, statusNote, invoiceTarget];

    if (targetStatus === "SUSPENDED_EFFORT") {
      query += ", suspended_reason=?";
      params.push(suspendedReason);
    } else if (targetStatus === "ABORTED") {
      query += ", aborted_reason=?";
      params.push(abortedReason);
    } else if (targetStatus === "CONTRACT_SIGNED") {
      query += ", signed_date=COALESCE(?, CURDATE())";
      params.push(signedDate || null);
    }

    if (invoiceNumber) {
      query += ", invoice_number=?, invoiced_at=COALESCE(invoiced_at, CURRENT_TIMESTAMP)";
      params.push(invoiceNumber);
    }

    query += " WHERE id=?";
    params.push(dealId);

    await db().execute(query, params);

    // Auto-acknowledge pending steps and log acknowledged step for new stage
    await db().execute(
      `UPDATE deal_funnel_steps 
       SET admin_review_status='ACKNOWLEDGED', 
           admin_remarks=COALESCE(admin_remarks, 'Auto-acknowledged upon admin stage update'), 
           reviewed_by_user_id=?, 
           reviewed_at=CURRENT_TIMESTAMP 
       WHERE deal_id=? AND admin_review_status='PENDING_REVIEW'`,
      [admin.id, dealId]
    );

    const stepTitle = isReissuance
      ? `Re-issued Invoice: ${invoiceNumber} (Replaced ${existingDeal.invoice_number})`
      : `Stage Advanced to ${targetStatus.replaceAll("_", " ")}`;

    const stepNotes = isReissuance
      ? `Historical reference log: Previous invoice ${existingDeal.invoice_number} was replaced by active invoice ${invoiceNumber}. Past invoice preserved for audit reference only (0 double counting).`
      : (statusNote || suspendedReason || abortedReason || "Stage updated by administrator");

    await db().execute(
      `INSERT INTO deal_funnel_steps 
        (deal_id, from_stage, to_stage, step_title, affiliate_notes, submitted_by_user_id, admin_review_status, admin_remarks, reviewed_by_user_id, reviewed_at, is_immutable)
       VALUES (?, null, ?, ?, ?, ?, 'ACKNOWLEDGED', 'Updated directly by administrator', ?, CURRENT_TIMESTAMP, 1)`,
      [
        dealId,
        targetStatus,
        stepTitle,
        stepNotes,
        admin.id,
        admin.id,
      ]
    );

    return NextResponse.redirect(
      new URL("/foliodesk/admin/deals?success=Deal+status+updated+successfully", getBaseUrl(req)),
      303
    );
  }

  if (action === "TOGGLE_INVOICE_TARGET" && dealId) {
    const target = String(f.get("invoiceTarget") || "PROSPECT").toUpperCase() === "AFFILIATE" ? "AFFILIATE" : "PROSPECT";
    await db().execute("UPDATE deal_pipeline SET invoice_target=? WHERE id=?", [target, dealId]);
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals/${dealId}?success=Invoicing+target+updated+to+${target}`, getBaseUrl(req)),
      303
    );
  }

  return NextResponse.redirect(new URL("/foliodesk/admin/deals", getBaseUrl(req)), 303);
}
