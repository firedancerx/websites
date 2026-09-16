import { NextResponse } from "next/server";
import { currentUser, getBaseUrl } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { generateDealCode, checkProspectExclusivity, logFunnelStep } from "../../../../lib/funnel";
import { isValidEmail, isValidPhone } from "../../../../lib/validation";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const [apps] = await db().execute<any[]>(
    "SELECT id, status FROM affiliate_applications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1",
    [user.id]
  );
  const app = apps[0];
  if (!app) {
    return NextResponse.redirect(new URL("/foliodesk/portal?error=No+affiliate+profile+found", getBaseUrl(req)), 303);
  }

  if (app.status === "RETRACTED" || app.status === "RETRACTION_ACKNOWLEDGED" || app.status === "SUSPENDED" || app.status === "TERMINATED") {
    return NextResponse.redirect(
      new URL("/foliodesk/portal?tab=pipeline&error=Your+affiliateship+is+not+active+for+submitting+new+leads", getBaseUrl(req)),
      303
    );
  }

  const f = await req.formData();
  const customerName = String(f.get("customerName") || "").trim();
  const customerEmail = String(f.get("customerEmail") || "").trim().toLowerCase();
  const customerPhone = String(f.get("customerPhone") || "").trim() || null;
  const packageName = String(f.get("packageName") || "FolioDesk Cloud Enterprise").trim();
  const packageCount = Math.max(1, Number(f.get("packageCount") || 1));
  const contractValueMyr = parseFloat(String(f.get("contractValueMyr") || "60000.00"));
  const notes = String(f.get("notes") || "").trim();
  // F-14 (plan §8 item 10, §4): pass is_test explicitly instead of relying on
  // the DB column default, matching the pattern already used correctly in
  // app/api/portal/prospects/route.ts and app/api/admin/deals/route.ts.
  const isTest = f.has("isTest") ? (f.get("isTest") === "1" || f.get("isTest") === "on" ? 1 : 0) : 1;

  if (!customerName || !customerEmail || isNaN(contractValueMyr) || contractValueMyr <= 0) {
    return NextResponse.redirect(
      new URL("/foliodesk/portal?tab=pipeline&error=Please+provide+valid+customer+company+name,+email,+and+estimated+contract+value", getBaseUrl(req)),
      303
    );
  }

  if (!isValidEmail(customerEmail)) {
    return NextResponse.redirect(
      new URL("/foliodesk/portal?tab=pipeline&error=Invalid+email+format.+Please+enter+a+valid+email+address+(e.g.+contact%40company.com).", getBaseUrl(req)),
      303
    );
  }

  if (customerPhone && !isValidPhone(customerPhone)) {
    return NextResponse.redirect(
      new URL("/foliodesk/portal?tab=pipeline&error=Invalid+phone+number+format.+Phone+numbers+cannot+contain+letters.", getBaseUrl(req)),
      303
    );
  }

  // F-09 (plan §8 item 7): this was the one deal-creation entry point that
  // skipped both the exclusivity check and the funnel-step audit trail --
  // brought up to parity with app/api/portal/prospects/route.ts (the plan's
  // reference implementation) rather than duplicating its own copy.
  const exclusivity = await checkProspectExclusivity(customerName);
  if (!exclusivity.isAvailable) {
    const activeAffiliate = exclusivity.activeDeal?.affiliate_legal_name || "another affiliate";
    return NextResponse.redirect(
      new URL(
        `/foliodesk/portal?tab=pipeline&error=Prospect+conflict:+The+company+'${encodeURIComponent(customerName)}'+is+currently+actively+registered+by+${encodeURIComponent(activeAffiliate)}.+Prospect+names+are+exclusively+protected+until+the+case+is+closed+or+stopped.`,
        getBaseUrl(req)
      ),
      303
    );
  }

  const dealCode = generateDealCode();
  const [dealRes]: any = await db().execute(
    `INSERT INTO deal_pipeline 
      (affiliate_id, deal_code, customer_name, customer_email, customer_phone, package_name, package_count, contract_value_myr, status, status_note, is_test)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'LEAD_SUBMITTED', ?, ?)`,
    [
      app.id,
      dealCode,
      customerName,
      customerEmail,
      customerPhone,
      packageName,
      packageCount,
      contractValueMyr,
      notes || null,
      isTest,
    ]
  );
  const dealId = dealRes.insertId;

  await logFunnelStep({
    dealId,
    fromStage: null,
    toStage: "LEAD_SUBMITTED",
    stepTitle: "1. Prospect Named & Registered",
    affiliateNotes: notes || "Initial commercial introduction and account registration.",
    submittedByUserId: user.id,
    isTest,
  });

  return NextResponse.redirect(
    new URL("/foliodesk/portal?tab=pipeline&success=Prospective+customer+lead+introduced+successfully!+The+FolioDesk+commercial+team+has+been+notified.", getBaseUrl(req)),
    303
  );
}
