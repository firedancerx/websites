import { NextResponse } from "next/server";
import { currentUser, getBaseUrl } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { generateDealCode } from "../../../../lib/funnel";
import { isValidEmail, isValidPhone } from "../../../../lib/validation";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const [apps] = await db().execute<DatabaseRow[]>(
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

  const dealCode = generateDealCode();
  await db().execute(
    `INSERT INTO deal_pipeline 
      (affiliate_id, deal_code, customer_name, customer_email, customer_phone, package_name, package_count, contract_value_myr, status, status_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'LEAD_SUBMITTED', ?)`,
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
    ]
  );

  return NextResponse.redirect(
    new URL("/foliodesk/portal?tab=pipeline&success=Prospective+customer+lead+introduced+successfully!+The+FolioDesk+commercial+team+has+been+notified.", getBaseUrl(req)),
    303
  );
}
