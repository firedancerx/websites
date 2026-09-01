import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../../lib/auth";
import { forceCloseDeal, extendDealDirectly, adjudicateDealAppeal } from "../../../../../../lib/funnel";

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
      await adjudicateDealAppeal({
        dealId,
        isApproved: isAppealApproved,
        daysExtended: isAppealApproved ? daysExtended : 0,
        notes: reason || (isAppealApproved ? `Appeal approved with ${daysExtended} days extension` : "Appeal rejected"),
        adminUserId: admin.id,
      });
      return NextResponse.redirect(
        new URL(
          `/foliodesk/admin/deals/${dealId}?success=Affiliate+appeal+${isAppealApproved ? `approved+with+${daysExtended}+days+extension` : "rejected"}`,
          getBaseUrl(req)
        ),
        303
      );
    }

    return NextResponse.redirect(new URL(`/foliodesk/admin/deals/${dealId}`, getBaseUrl(req)), 303);
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals/${dealId}?error=${encodeURIComponent(err?.message || "Failed to process closure action")}`, getBaseUrl(req)),
      303
    );
  }
}
