import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { generateDealCode, checkProspectExclusivity } from "../../../../lib/funnel";
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

    // F-09 (plan §8 item 7): the third of three deal-creation entry points
    // that skipped the exclusivity check used by app/api/portal/prospects/route.ts
    // (the reference implementation). Applied here too so an Admin-created
    // deal cannot silently collide with a prospect an affiliate already has
    // actively registered.
    const exclusivityCheck = await checkProspectExclusivity(customerName);
    if (!exclusivityCheck.isAvailable) {
      const activeAffiliate = exclusivityCheck.activeDeal?.affiliate_legal_name || "another affiliate";
      return NextResponse.redirect(
        new URL(
          `/foliodesk/admin/deals?error=Prospect+conflict:+The+company+'${encodeURIComponent(customerName)}'+is+currently+actively+registered+by+${encodeURIComponent(activeAffiliate)}.+Prospect+names+are+exclusively+protected+until+the+case+is+closed+or+stopped.`,
          getBaseUrl(req)
        ),
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

    const [existingRows] = await db().execute<any[]>("SELECT invoice_number, invoice_target, status FROM deal_pipeline WHERE id=? LIMIT 1", [dealId]);
    const existingDeal = existingRows[0] || null;
    const isReissuance = existingDeal?.invoice_number && existingDeal.invoice_number !== invoiceNumber;
    // F-12 (plan §8 item 8): only touch invoice_target when the submitting form
    // actually included it -- the quick status-update forms in DealsView.tsx
    // don't send this field, and unconditionally defaulting it to 'PROSPECT'
    // here would silently reset an existing 'AFFILIATE' target on every such
    // update. Explicit-only, same discipline invoiceNumber already had.
    const invoiceTargetProvided = f.has("invoiceTarget");
    const isTargetChange = invoiceTargetProvided && existingDeal && invoiceTarget !== existingDeal.invoice_target;

    if (isReissuance || isTargetChange) {
      const [lockedRows] = await db().execute<any[]>(
        "SELECT COUNT(*) AS locked_count FROM deal_collections WHERE deal_id=? AND is_immutable=1",
        [dealId]
      );
      if (Number(lockedRows[0]?.locked_count) > 0) {
        return NextResponse.redirect(
          new URL(
            "/foliodesk/admin/deals?error=This+deal+has+an+approved+or+rejected+(sealed)+collection+attached.+The+invoice+number+and+billing+target+can+no+longer+be+changed.",
            getBaseUrl(req)
          ),
          303
        );
      }
    }

    let query = "UPDATE deal_pipeline SET status=?, status_note=COALESCE(?, status_note)";
    const params: any[] = [targetStatus, statusNote];

    if (invoiceTargetProvided) {
      query += ", invoice_target=?";
      params.push(invoiceTarget);
    }

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

    // F-12 (plan §8 item 8): same immutability guard as the UPDATE_STATUS
    // invoice-reissue path above -- once any collection on this deal is
    // sealed (approved or rejected), its locked commission rates were
    // derived against the invoice/billing target at that moment, so the
    // target can no longer be switched underneath it.
    const [lockedRows] = await db().execute<any[]>(
      "SELECT COUNT(*) AS locked_count FROM deal_collections WHERE deal_id=? AND is_immutable=1",
      [dealId]
    );
    if (Number(lockedRows[0]?.locked_count) > 0) {
      return NextResponse.redirect(
        new URL(
          `/foliodesk/admin/deals/${dealId}?error=This+deal+has+an+approved+or+rejected+(sealed)+collection+attached.+The+billing+target+can+no+longer+be+changed.`,
          getBaseUrl(req)
        ),
        303
      );
    }

    await db().execute("UPDATE deal_pipeline SET invoice_target=? WHERE id=?", [target, dealId]);
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals/${dealId}?success=Invoicing+target+updated+to+${target}`, getBaseUrl(req)),
      303
    );
  }

  return NextResponse.redirect(new URL("/foliodesk/admin/deals", getBaseUrl(req)), 303);
}
