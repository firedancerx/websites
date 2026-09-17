import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../../lib/auth";
import { db } from "../../../../../../lib/db";
import { forceCloseDeal, extendDealDirectly } from "../../../../../../lib/funnel";
import { validateCsrfFromForm } from "../../../../../../lib/csrf";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const { id } = await params;
  const dealId = Number(id);

  const f = await req.formData();
  const action = String(f.get("action") || "");
  const reason = String(f.get("reason") || "").trim();
  const daysExtended = parseInt(String(f.get("daysExtended") || "30"), 10);
  const isAppealApproved = f.get("isAppealApproved") === "1";

  // T-510 (F-15): CSRF synchronizer-token check. Must run before any mutation below.
  if (!(await validateCsrfFromForm(f, admin.session_csrf_hash))) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals/${dealId}?error=Your+session+expired.+Please+try+again.`, getBaseUrl(req)),
      303
    );
  }

  try {
    if (action === "FORCE_CLOSE") {
      if (!reason) {
        return NextResponse.redirect(
          new URL(`/foliodesk/admin/deals/${dealId}?error=Reason+for+forced+closure+is+mandatory`, getBaseUrl(req)),
          303
        );
      }
      await forceCloseDeal({ dealId, reason, adminUserId: admin.id });
      return NextResponse.redirect(
        new URL(`/foliodesk/admin/deals/${dealId}?success=Prospect+attempt+force-closed+due+to+closure+period+expiry`, getBaseUrl(req)),
        303
      );
    }

    if (action === "EXTEND_DIRECT") {
      if (isNaN(daysExtended) || daysExtended <= 0) {
        return NextResponse.redirect(
          new URL(`/foliodesk/admin/deals/${dealId}?error=Please+specify+valid+number+of+extension+days`, getBaseUrl(req)),
          303
        );
      }
      await extendDealDirectly({
        dealId,
        daysExtended,
        notes: reason || `Extended by ${daysExtended} days by administrator`,
        adminUserId: admin.id,
      });
      return NextResponse.redirect(
        new URL(`/foliodesk/admin/deals/${dealId}?success=Closure+period+extended+by+${daysExtended}+days+successfully`, getBaseUrl(req)),
        303
      );
    }

    if (action === "ADJUDICATE_APPEAL") {
      // T-404 (plan §7.3(4), §7.8): this no longer calls adjudicateDealAppeal()
      // directly. The Admin's reviewed recommendation (isAppealApproved,
      // daysExtended, notes) is captured as a maker_checker_requests row;
      // adjudicateDealAppeal() only runs once a Management user independently
      // confirms it via app/api/management/deals/[id]/closure/decide/route.ts.
      // This applies to adjudication of the appeal specifically -- not the
      // initial FORCE_CLOSE action above, which is unchanged (it is the
      // protective action that triggers the appeal right in the first place).
      const [existingRows] = await db().execute<any[]>(
        "SELECT id FROM maker_checker_requests WHERE entity_type='deal_pipeline' AND entity_id=? AND request_type='CLOSURE_APPEAL_ADJUDICATION' AND status='PENDING' LIMIT 1",
        [dealId]
      );
      if (existingRows.length > 0) {
        return NextResponse.redirect(
          new URL(`/foliodesk/admin/deals/${dealId}?error=A+Management+adjudication+request+for+this+appeal+is+already+pending`, getBaseUrl(req)),
          303
        );
      }

      const notes = reason || (isAppealApproved ? `Appeal approved with ${daysExtended} days extension` : "Appeal rejected");

      await db().execute(
        `INSERT INTO maker_checker_requests
          (request_type, entity_type, entity_id, action_payload, status, submitted_by)
         VALUES ('CLOSURE_APPEAL_ADJUDICATION', 'deal_pipeline', ?, ?, 'PENDING', ?)`,
        [
          dealId,
          JSON.stringify({ dealId, isApproved: isAppealApproved, daysExtended: isAppealApproved ? daysExtended : 0, notes }),
          admin.id,
        ]
      );

      await db().execute(
        "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'APPEAL_ADJUDICATION_SUBMITTED','deal_pipeline',?,JSON_OBJECT('recommendedApproval',?))",
        [admin.id, String(dealId), isAppealApproved]
      );

      return NextResponse.redirect(
        new URL(
          `/foliodesk/admin/deals/${dealId}?success=Adjudication+recommendation+submitted+for+Management+sign-off.+No+change+takes+effect+until+approved.`,
          getBaseUrl(req)
        ),
        303
      );
    }

    return NextResponse.redirect(new URL(`/foliodesk/admin/deals/${dealId}`, getBaseUrl(req)), 303);
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals/${dealId}?error=${encodeURIComponent(errorMessage(err, "Failed to process closure action"))}`, getBaseUrl(req)),
      303
    );
  }
}
