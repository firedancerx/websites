import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { db } from "../../../lib/db";
import { hashPassword, getBaseUrl, generateAffiliateCode, currentUser } from "../../../lib/auth";

export async function POST(req: Request) {
  try {
    const f = await req.formData();
    const isReinstatement = f.get("isReinstatement") === "1";
    const loggedInUser = await currentUser();

    const email = String(f.get("email") || "").trim().toLowerCase();
    const password = String(f.get("password") || "");
    const confirmPassword = String(f.get("confirmPassword") || "");
    const fullName = String(f.get("fullName") || "").trim();

    if (isReinstatement && loggedInUser) {
      // Reinstatement flow for existing retracted affiliate
      if (password.length > 0) {
        if (password !== confirmPassword) {
          return NextResponse.redirect(
            new URL("/foliodesk/register?error=Passwords+do+not+match", getBaseUrl(req)),
            303
          );
        }
        if (password.length < 12) {
          return NextResponse.redirect(
            new URL("/foliodesk/register?error=Password+must+be+at+least+12+characters", getBaseUrl(req)),
            303
          );
        }
      }
    } else {
      // Standard new registration flow
      if (password !== confirmPassword) {
        return NextResponse.redirect(
          new URL("/foliodesk/register?error=Passwords+do+not+match", getBaseUrl(req)),
          303
        );
      }
      if (!email.includes("@") || password.length < 12 || !fullName || f.get("declaration") !== "yes") {
        return NextResponse.redirect(
          new URL("/foliodesk/register?error=Please+complete+all+required+fields", getBaseUrl(req)),
          303
        );
      }
    }

    const legalName = String(f.get("legalName") || "").trim();
    const applicantType = String(f.get("applicantType") || "INDIVIDUAL");
    const companyNumber = String(f.get("companyNumber") || "").trim() || null;
    const countryCode = String(f.get("countryCode") || "MY").toUpperCase().trim();
    const state = String(f.get("state") || "").trim();
    const town = String(f.get("town") || "").trim();
    const postcode = String(f.get("postcode") || "").trim();
    const currency = String(f.get("currency") || "MYR").toUpperCase().trim();
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

    const idDocFile = f.get("idDoc") as File | null;
    const holdingIdFile = f.get("holdingId") as File | null;

    const uploadDir = join(process.cwd(), "public", "uploads", "id-documents");
    await mkdir(uploadDir, { recursive: true });

    // Handle Reinstatement of an existing user & application
    if (isReinstatement && loggedInUser) {
      const [existingApps]: any = await db().execute(
        "SELECT * FROM affiliate_applications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1",
        [loggedInUser.id]
      );
      const prevApp = existingApps[0];
      if (!prevApp) {
        return NextResponse.redirect(
          new URL("/foliodesk/register?error=No+previous+application+found+to+reinstate", getBaseUrl(req)),
          303
        );
      }

      let idDocPath = prevApp.id_doc_path;
      if (idDocFile && idDocFile.size > 0) {
        const idDocExt = idDocFile.name.split(".").pop() || "jpg";
        const idDocFileName = `id_doc_${Date.now()}_${randomBytes(4).toString("hex")}.${idDocExt}`;
        const idDocBuffer = Buffer.from(await idDocFile.arrayBuffer());
        await writeFile(join(uploadDir, idDocFileName), idDocBuffer);
        idDocPath = `/foliodesk/uploads/id-documents/${idDocFileName}`;
      }

      let holdingIdPath = prevApp.holding_id_path;
      if (holdingIdFile && holdingIdFile.size > 0) {
        const holdingIdExt = holdingIdFile.name.split(".").pop() || "jpg";
        const holdingIdFileName = `holding_id_${Date.now()}_${randomBytes(4).toString("hex")}.${holdingIdExt}`;
        const holdingIdBuffer = Buffer.from(await holdingIdFile.arrayBuffer());
        await writeFile(join(uploadDir, holdingIdFileName), holdingIdBuffer);
        holdingIdPath = `/foliodesk/uploads/id-documents/${holdingIdFileName}`;
      }

      const conn = await db().getConnection();
      try {
        await conn.beginTransaction();

        // Update user name/password
        if (password.length >= 12) {
          await conn.execute("UPDATE users SET full_name=?, password_hash=? WHERE id=?", [
            fullName || loggedInUser.full_name,
            hashPassword(password),
            loggedInUser.id,
          ]);
        } else {
          await conn.execute("UPDATE users SET full_name=? WHERE id=?", [
            fullName || loggedInUser.full_name,
            loggedInUser.id,
          ]);
        }

        // Reactivate application status to SUBMITTED
        const prevStatus = prevApp.status;
        await conn.execute(
          `UPDATE affiliate_applications SET 
            status='SUBMITTED',
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
            upline_affiliate_code=?,
            decided_at=NULL,
            decision_note='Application resubmitted for reinstatement by partner.'
          WHERE id=?`,
          [
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
            uplineCode,
            prevApp.id,
          ]
        );

        await conn.execute(
          "INSERT INTO application_status_history(application_id,from_status,to_status,changed_by,public_message) VALUES(?,?,?,'SUBMITTED','Application resubmitted for reinstatement by partner.')",
          [prevApp.id, prevStatus, loggedInUser.id]
        );

        await conn.execute(
          "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'APPLICATION_REINSTATED','affiliate_application',?,JSON_OBJECT('from',?,'to','SUBMITTED'))",
          [loggedInUser.id, String(prevApp.id), prevStatus]
        );

        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }

      return NextResponse.redirect(
        new URL("/foliodesk/portal?success=Your+application+has+been+resubmitted+for+reinstatement+and+is+under+review.", getBaseUrl(req)),
        303
      );
    }

    // Standard Registration Flow
    if (!idDocFile || idDocFile.size === 0 || !holdingIdFile || holdingIdFile.size === 0) {
      return NextResponse.redirect(
        new URL("/foliodesk/register?error=Both+ID+document+picture+and+Photo+holding+ID+are+mandatory", getBaseUrl(req)),
        303
      );
    }

    const idDocExt = idDocFile.name.split(".").pop() || "jpg";
    const idDocFileName = `id_doc_${Date.now()}_${randomBytes(4).toString("hex")}.${idDocExt}`;
    const idDocBuffer = Buffer.from(await idDocFile.arrayBuffer());
    await writeFile(join(uploadDir, idDocFileName), idDocBuffer);
    const idDocPath = `/foliodesk/uploads/id-documents/${idDocFileName}`;

    const holdingIdExt = holdingIdFile.name.split(".").pop() || "jpg";
    const holdingIdFileName = `holding_id_${Date.now()}_${randomBytes(4).toString("hex")}.${holdingIdExt}`;
    const holdingIdBuffer = Buffer.from(await holdingIdFile.arrayBuffer());
    await writeFile(join(uploadDir, holdingIdFileName), holdingIdBuffer);
    const holdingIdPath = `/foliodesk/uploads/id-documents/${holdingIdFileName}`;

    // Generate unique 9-character affiliate code (numbers & uppercase letters)
    let affiliateCode = generateAffiliateCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const [dup]: any = await db().execute(
        "SELECT id FROM affiliate_applications WHERE affiliate_code=? LIMIT 1",
        [affiliateCode]
      );
      if (!dup[0]) {
        isUnique = true;
      } else {
        affiliateCode = generateAffiliateCode();
        attempts++;
      }
    }

    const isTest = f.has("isTest") ? (f.get("isTest") === "1" || f.get("isTest") === "on" ? 1 : 0) : 1;

    const conn = await db().getConnection();
    try {
      await conn.beginTransaction();
      const [u]: any = await conn.execute(
        "INSERT INTO users(email,password_hash,full_name,role) VALUES(?,?,?,'APPLICANT')",
        [email, hashPassword(password), fullName]
      );
      const number = `FDA-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
      const [a]: any = await conn.execute(
        `INSERT INTO affiliate_applications(
          user_id, application_number, applicant_type, legal_name, company_number, 
          country_code, state, town, postcode, currency, address_line1, address_line2, address_line3,
          phone, website_url, social_url, market_focus, audience_description, promotion_method,
          id_doc_path, holding_id_path, affiliate_code, upline_affiliate_code, is_test
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          u.insertId,
          number,
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
          affiliateCode,
          uplineCode,
          isTest,
        ]
      );
      await conn.execute(
        "INSERT INTO application_status_history(application_id,to_status,public_message) VALUES(?,'SUBMITTED','Application received')",
        [a.insertId]
      );
      await conn.execute(
        "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id) VALUES(?,'APPLICATION_SUBMITTED','affiliate_application',?)",
        [u.insertId, String(a.insertId)]
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    return NextResponse.redirect(new URL("/foliodesk/login?registered=1", getBaseUrl(req)), 303);
  } catch (e: any) {
    const msg =
      e?.code === "ER_DUP_ENTRY"
        ? "An account already exists for that email or registration number"
        : "We could not save your application. Check the database connection.";
    return NextResponse.redirect(new URL(`/foliodesk/register?error=${encodeURIComponent(msg)}`, getBaseUrl(req)), 303);
  }
}
