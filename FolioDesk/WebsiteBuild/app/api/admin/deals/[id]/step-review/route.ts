import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../../lib/auth";
import { reviewFunnelStep } from "../../../../../../lib/funnel";

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
  const stepId = Number(f.get("stepId"));
  const action = String(f.get("action") || "ACKNOWLEDGE");
  const adminRemarks = String(f.get("adminRemarks") || "").trim();

  if (!stepId) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals/${dealId}?error=Step+ID+is+required`, getBaseUrl(req)),
      303
    );
  }

  if (action === "RETURN_FOR_REVIEW" && !adminRemarks) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals/${dealId}?error=Remarks+are+mandatory+when+returning+a+step+for+review`, getBaseUrl(req)),
      303
    );
  }

  try {
    const reviewStatus = action === "RETURN_FOR_REVIEW" ? "RETURNED_FOR_REVIEW" : "ACKNOWLEDGED";
    await reviewFunnelStep({
      stepId,
      reviewStatus,
      adminRemarks,
      reviewerUserId: admin.id,
    });

    const msg =
      reviewStatus === "ACKNOWLEDGED"
        ? "Sales+funnel+step+acknowledged+and+stage+updated+successfully"
        : "Sales+funnel+step+returned+for+review+with+remarks";

    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals/${dealId}?success=${msg}`, getBaseUrl(req)),
      303
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals/${dealId}?error=${encodeURIComponent(err?.message || "Failed to review step")}`, getBaseUrl(req)),
      303
    );
  }
}
