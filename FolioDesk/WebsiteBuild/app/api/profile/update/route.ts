import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { currentUser, hashPassword, getBaseUrl } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const [apps] = await db().execute<any[]>(
    "SELECT * FROM affiliate_applications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1",
    [user.id]
  );
  const app = apps[0];

  if (app?.status === "RETRACTED" || app?.status === "RETRACTION_ACKNOWLEDGED") {
    return NextResponse.redirect(
      new URL("/foliodesk/portal?error=Affiliateship+is+retracted.+Profile+is+in+read-only+mode+and+cannot+be+edited.", getBaseUrl(req)),
      303
    );
  }

  if (user.status === "SUSPENDED" || app?.status === "SUSPENDED" || app?.status === "TERMINATED") {
    return NextResponse.redirect(
      new URL("/foliodesk/portal?error=Account+or+application+is+suspended+and+cannot+be+edited", getBaseUrl(req)),
      303
    );
  }

  const f = await req.formData();
  const fullName = String(f.get("fullName") || "").trim();
  const password = String(f.get("password") || "");
  const confirmPassword = String(f.get("confirmPassword") || "");

  const legalName = String(f.get("legalName") || "").trim();
  const applicantType = String(f.get("applicantType") || "INDIVIDUAL");
  const companyNumber = String(f.get("companyNumber") || "").trim() || null;
  const countryCode = String(f.get("countryCode") || "MY").toUpperCase().trim();
  const state = String(f.get("state") || "").trim();
  const town = String(f.get("town") || "").trim();
  const postcode = String(f.get("postcode") || "").trim();

  // Currency fetched from countries table in DB
  const [cRows] = await db().execute<any[]>(
    "SELECT currency FROM countries WHERE code=? LIMIT 1",
    [countryCode]
  );
  const currency = cRows[0]?.currency || "MYR";

  const addressLine1 = String(f.get("addressLine1") || "").trim();
  const addressLine2 = String(f.get("addressLine2") || "").trim() || null;
  const addressLine3 = String(f.get("addressLine3") || "").trim() || null;

  const phone = String(f.get("phone") || "").trim();
  const websiteUrl = String(f.get("websiteUrl") || "").trim() || null;
  const socialUrl = String(f.get("socialUrl") || "").trim() || null;
  const marketFocus = String(f.get("marketFocus") || "MALAYSIA");
  const audience = String(f.get("audience") || "").trim();
  const promotion = String(f.get("promotion") || "").trim();

  const uplineCode = String(f.get("uplineCode") || "").toUpperCase().trim() || null;

  if (password.length > 0) {
    if (password !== confirmPassword) {
      return NextResponse.redirect(
        new URL("/foliodesk/portal?edit=1&error=Passwords+do+not+match", getBaseUrl(req)),
        303
      );
    }
    if (password.length < 12) {
      return NextResponse.redirect(
        new URL("/foliodesk/portal?edit=1&error=Password+must+be+at+least+12+characters", getBaseUrl(req)),
        303
      );
    }
    const newHash = hashPassword(password);
    await db().execute("UPDATE users SET full_name=?, password_hash=? WHERE id=?", [
      fullName || user.full_name,
      newHash,
      user.id,
    ]);
  } else {
    await db().execute("UPDATE users SET full_name=? WHERE id=?", [
      fullName || user.full_name,
      user.id,
    ]);
  }

  if (app && legalName) {
    let idDocPath = app.id_doc_path;
    let holdingIdPath = app.holding_id_path;

    // Check if uploads & upline code are editable under CORRECTION_REQUIRED or INFORMATION_REQUIRED
    const canEditUploadsAndUpline =
      app.status === "CORRECTION_REQUIRED" || app.status === "INFORMATION_REQUIRED";

    // Handle new file uploads if provided (allowed for initial correction or APPROVED profile updates)
    if (canEditUploadsAndUpline || app.status === "APPROVED") {
      const uploadDir = join(process.cwd(), "public", "uploads", "id-documents");
      await mkdir(uploadDir, { recursive: true });

      const idDocFile = f.get("idDoc") as File | null;
      if (idDocFile && idDocFile.size > 0) {
        const ext = idDocFile.name.split(".").pop() || "jpg";
        const fileName = `id_doc_${Date.now()}_${randomBytes(4).toString("hex")}.${ext}`;
        const buf = Buffer.from(await idDocFile.arrayBuffer());
        await writeFile(join(uploadDir, fileName), buf);
        idDocPath = `/foliodesk/uploads/id-documents/${fileName}`;
      }

      const holdingIdFile = f.get("holdingId") as File | null;
      if (holdingIdFile && holdingIdFile.size > 0) {
        const ext = holdingIdFile.name.split(".").pop() || "jpg";
        const fileName = `holding_id_${Date.now()}_${randomBytes(4).toString("hex")}.${ext}`;
        const buf = Buffer.from(await holdingIdFile.arrayBuffer());
        await writeFile(join(uploadDir, fileName), buf);
        holdingIdPath = `/foliodesk/uploads/id-documents/${fileName}`;
      }
    }

    if (app.status === "APPROVED") {
      // eKYC Workflow: Create or update pending profile update request without touching active profile
      const [existingPending] = await db().execute<any[]>(
        "SELECT id FROM affiliate_profile_updates WHERE application_id=? AND status='PENDING_APPROVAL' LIMIT 1",
        [app.id]
      );

      const proposedFullName = fullName || user.full_name;

      if (existingPending.length > 0) {
        await db().execute(
          `UPDATE affiliate_profile_updates SET 
            full_name=?, 
            applicant_type=?, 
            legal_name=?, 
            company_number=?, 
            country_code=?, 
            state=?, 
            town=?, 
            postcode=?, 
            currency=?, 
            address_line1=?, 
            address_line2=?, 
            address_line3=?, 
            phone=?, 
            website_url=?, 
            social_url=?, 
            market_focus=?, 
            audience_description=?, 
            promotion_method=?, 
            id_doc_path=?, 
            holding_id_path=?,
            admin_remarks=NULL,
            updated_at=CURRENT_TIMESTAMP
          WHERE id=?`,
          [
            proposedFullName,
            applicantType,
            legalName,
            companyNumber,
            countryCode,
            state,
            town,
            postcode,
            currency,
            addressLine1,
            addressLine2,
            addressLine3,
            phone,
            websiteUrl,
            socialUrl,
            marketFocus,
            audience,
            promotion,
            idDocPath,
            holdingIdPath,
            existingPending[0].id,
          ]
        );
      } else {
        await db().execute(
          `INSERT INTO affiliate_profile_updates (
            application_id, user_id, status, full_name, applicant_type, legal_name, company_number,
            country_code, state, town, postcode, currency, address_line1, address_line2, address_line3,
            phone, website_url, social_url, market_focus, audience_description, promotion_method,
            id_doc_path, holding_id_path, upline_affiliate_code
          ) VALUES (?, ?, 'PENDING_APPROVAL', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            app.id,
            user.id,
            proposedFullName,
            applicantType,
            legalName,
            companyNumber,
            countryCode,
            state,
            town,
            postcode,
            currency,
            addressLine1,
            addressLine2,
            addressLine3,
            phone,
            websiteUrl,
            socialUrl,
            marketFocus,
            audience,
            promotion,
            idDocPath,
            holdingIdPath,
            app.upline_affiliate_code,
          ]
        );
      }

      await db().execute(
        "INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id) VALUES (?, 'PROFILE_UPDATE_SUBMITTED', 'affiliate_profile_updates', ?)",
        [user.id, String(app.id)]
      );

      return NextResponse.redirect(
        new URL(
          "/foliodesk/portal?success=Profile+update+submitted+for+Admin+eKYC+review.+Your+current+active+profile+remains+active+until+approved.",
          getBaseUrl(req)
        ),
        303
      );
    }

    // Initial Application Correction / Resubmission Flow (for non-APPROVED applications)
    const isAwaitingOrReturned =
      app.status === "CORRECTION_REQUIRED" ||
      app.status === "INFORMATION_REQUIRED" ||
      app.status === "UNDER_REVIEW" ||
      app.status === "SUBMITTED";

    const newStatus = isAwaitingOrReturned ? "SUBMITTED" : app.status;
    const newFlagIdDoc = isAwaitingOrReturned ? 0 : (app.flag_id_doc_unclear || 0);
    const newFlagHoldingId = isAwaitingOrReturned ? 0 : (app.flag_holding_id_unaccepted || 0);
    let updatedUplineCode = canEditUploadsAndUpline ? uplineCode : app.upline_affiliate_code;

    await db().execute(
      `UPDATE affiliate_applications SET 
        legal_name=?, 
        applicant_type=?, 
        company_number=?, 
        country_code=?, 
        state=?, 
        town=?, 
        postcode=?, 
        currency=?, 
        address_line1=?, 
        address_line2=?, 
        address_line3=?, 
        phone=?, 
        website_url=?, 
        social_url=?, 
        market_focus=?, 
        audience_description=?, 
        promotion_method=?, 
        id_doc_path=?, 
        holding_id_path=?, 
        upline_affiliate_code=?,
        status=?,
        flag_id_doc_unclear=?,
        flag_holding_id_unaccepted=?,
        submitted_at=CURRENT_TIMESTAMP
      WHERE id=?`,
      [
        legalName,
        applicantType,
        companyNumber,
        countryCode,
        state,
        town,
        postcode,
        currency,
        addressLine1,
        addressLine2,
        addressLine3,
        phone,
        websiteUrl,
        socialUrl,
        marketFocus,
        audience,
        promotion,
        idDocPath,
        holdingIdPath,
        updatedUplineCode,
        newStatus,
        newFlagIdDoc,
        newFlagHoldingId,
        app.id,
      ]
    );

    if (app.status === "CORRECTION_REQUIRED" || app.status === "INFORMATION_REQUIRED") {
      await db().execute(
        "INSERT INTO application_status_history (application_id, from_status, to_status, changed_by, public_message) VALUES (?, ?, 'SUBMITTED', ?, ?)",
        [
          app.id,
          app.status,
          user.id,
          "Application improved and resubmitted by applicant for review.",
        ]
      );
    }
  }

  const isResubmission =
    app &&
    (app.status === "CORRECTION_REQUIRED" ||
      app.status === "INFORMATION_REQUIRED" ||
      app.status === "UNDER_REVIEW" ||
      app.status === "SUBMITTED");

  await db().execute(
    "INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id) VALUES (?, ?, 'user', ?)",
    [user.id, isResubmission ? "APPLICATION_RESUBMITTED" : "PROFILE_UPDATED", String(user.id)]
  );

  const redirectMessage = isResubmission
    ? "Application+updated+and+resubmitted+for+review+successfully"
    : "Profile+updated+successfully";

  return NextResponse.redirect(
    new URL(`/foliodesk/portal?success=${redirectMessage}`, getBaseUrl(req)),
    303
  );
}
