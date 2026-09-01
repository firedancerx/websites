import { NextResponse } from "next/server";
import { currentUser, getBaseUrl } from "../../../../../../lib/auth";
import { db } from "../../../../../../lib/db";
import { logFunnelStep } from "../../../../../../lib/funnel";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const { id } = await params;
  const dealId = Number(id);

  const [apps] = await db().execute<any[]>(
    "SELECT id FROM affiliate_applications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1",
    [user.id]
  );
  const app = apps[0];
  if (!app) {
    return NextResponse.redirect(new URL("/foliodesk/portal", getBaseUrl(req)), 303);
  }

  const [deals] = await db().execute<any[]>(
    "SELECT * FROM deal_pipeline WHERE id=? AND affiliate_id=? LIMIT 1",
    [dealId, app.id]
  );
  const deal = deals[0];
  if (!deal) {
    return NextResponse.redirect(new URL("/foliodesk/portal/prospects?error=Prospect+not+found", getBaseUrl(req)), 303);
  }

  if (deal.is_force_closed === 1 && deal.appeal_status !== "APPEAL_SUBMITTED") {
    return NextResponse.redirect(
      new URL(`/foliodesk/portal/prospects/${dealId}?error=This+prospect+is+closed+due+to+closure+period+expiry.+Please+submit+an+appeal+first.`, getBaseUrl(req)),
      303
    );
  }

  const f = await req.formData();
  const toStage = String(f.get("toStage") || deal.status);
  const stepTitle = String(f.get("stepTitle") || "").trim();
  const affiliateNotes = String(f.get("affiliateNotes") || "").trim();

  if (!stepTitle || !affiliateNotes) {
    return NextResponse.redirect(
      new URL(`/foliodesk/portal/prospects/${dealId}?error=Step+title+and+progress+notes+are+mandatory`, getBaseUrl(req)),
      303
    );
  }

  try {
    await logFunnelStep({
      dealId,
      fromStage: deal.status,
      toStage,
      stepTitle,
      affiliateNotes,
      submittedByUserId: user.id,
    });

    return NextResponse.redirect(
      new URL(
        `/foliodesk/portal/prospects/${dealId}?success=Sales+funnel+update+submitted+for+administrative+acknowledgement.`,
        getBaseUrl(req)
      ),
      303
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/foliodesk/portal/prospects/${dealId}?error=${encodeURIComponent(err?.message || "Failed to log step")}`, getBaseUrl(req)),
      303
    );
  }
}
