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
  const f = await req.formData();
  const action = String(f.get("action") || "").toUpperCase();
  const adminRemarks = String(f.get("adminRemarks") || "").trim() || null;

  const [rows] = await db().execute<any[]>(
    "SELECT * FROM affiliate_profile_updates WHERE id=? LIMIT 1",
    [id]
  );
  const updateReq = rows[0];

  if (!updateReq) {
    return NextResponse.redirect(
      new URL("/foliodesk/admin?error=Profile+update+request+not+found", getBaseUrl(req)),
      303
    );
  }

  const returnUrl = `/foliodesk/admin/applications/${updateReq.application_id}/correction`;

  if (action === "APPROVE") {
    // 1. Mark profile update request as APPROVED
    await db().execute(
      `UPDATE affiliate_profile_updates SET 
        status='APPROVED', 
        admin_remarks=?, 
        reviewed_by_user_id=?, 
        reviewed_at=CURRENT_TIMESTAMP 
      WHERE id=?`,
      [adminRemarks, admin.id, updateReq.id]
    );

    // 2. Apply proposed profile changes to live affiliate_applications
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
        holding_id_path=? 
      WHERE id=?`,
      [
        updateReq.legal_name,
        updateReq.applicant_type,
        updateReq.company_number,
        updateReq.country_code,
        updateReq.state,
        updateReq.town,
        updateReq.postcode,
        updateReq.currency,
        updateReq.address_line1,
        updateReq.address_line2,
        updateReq.address_line3,
        updateReq.phone,
        updateReq.website_url,
        updateReq.social_url,
        updateReq.market_focus,
        updateReq.audience_description,
        updateReq.promotion_method,
        updateReq.id_doc_path,
        updateReq.holding_id_path,
        updateReq.application_id,
      ]
    );

    // 3. Update active user's full_name
    await db().execute("UPDATE users SET full_name=? WHERE id=?", [
      updateReq.full_name,
      updateReq.user_id,
    ]);

    // 4. Log audit event
    await db().execute(
      "INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id) VALUES (?, 'PROFILE_UPDATE_APPROVED', 'affiliate_profile_updates', ?)",
      [admin.id, String(updateReq.id)]
    );

    return NextResponse.redirect(
      new URL(
        `${returnUrl}?success=Profile+update+approved+successfully.+Live+profile+and+eKYC+records+updated.`,
        getBaseUrl(req)
      ),
      303
    );
  } else if (action === "REJECT") {
    // Mark profile update request as REJECTED
    await db().execute(
      `UPDATE affiliate_profile_updates SET 
        status='REJECTED', 
        admin_remarks=?, 
        reviewed_by_user_id=?, 
        reviewed_at=CURRENT_TIMESTAMP 
      WHERE id=?`,
      [adminRemarks, admin.id, updateReq.id]
    );

    // Log audit event
    await db().execute(
      "INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id) VALUES (?, 'PROFILE_UPDATE_REJECTED', 'affiliate_profile_updates', ?)",
      [admin.id, String(updateReq.id)]
    );

    return NextResponse.redirect(
      new URL(
        `${returnUrl}?success=Profile+update+rejected.+Active+profile+remains+unchanged.`,
        getBaseUrl(req)
      ),
      303
    );
  }

  return NextResponse.redirect(
    new URL(`${returnUrl}?error=Invalid+action+specified`, getBaseUrl(req)),
    303
  );
}
