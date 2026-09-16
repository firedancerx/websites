import { NextResponse } from "next/server";
import { currentUser, getBaseUrl } from "../../../../../../lib/auth";
import { db } from "../../../../../../lib/db";
import { submitDealAppeal } from "../../../../../../lib/funnel";
import { errorMessage } from "../../../../../../lib/errors";

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
    "SELECT id, status FROM affiliate_applications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1",
    [user.id]
  );
  const app = apps[0];
  if (!app) {
    return NextResponse.redirect(new URL("/foliodesk/portal", getBaseUrl(req)), 303);
  }

  // T-503 (plan §8 item 5, §6.2 Finding 3): same APPROVED allowlist as the
  // funnel-step route -- this route also had zero affiliate-status check.
  if (app.status !== "APPROVED") {
    return NextResponse.redirect(
      new URL("/foliodesk/portal/prospects?error=Your+affiliateship+is+not+active+for+submitting+appeals", getBaseUrl(req)),
      303
    );
  }

  const [deals] = await db().execute<any[]>(
    "SELECT * FROM deal_pipeline WHERE id=? AND affiliate_id=? LIMIT 1",
    [dealId, app.id]
  );
  const deal = deals[0];
  if (!deal) {
    return NextResponse.redirect(new URL("/foliodesk/portal/prospects?error=Prospect+not+found", getBaseUrl(req)), 303);
  }

  const f = await req.formData();
  const appealReason = String(f.get("appealReason") || "").trim();

  if (!appealReason) {
    return NextResponse.redirect(
      new URL(`/foliodesk/portal/prospects/${dealId}?error=Appeal+reason+and+extension+justification+are+mandatory`, getBaseUrl(req)),
      303
    );
  }

  try {
    await submitDealAppeal({
      dealId,
      reason: appealReason,
      affiliateUserId: user.id,
    });

    return NextResponse.redirect(
      new URL(
        `/foliodesk/portal/prospects/${dealId}?success=Appeal+submitted+successfully.+Our+management+team+will+review+your+extension+request.`,
        getBaseUrl(req)
      ),
      303
    );
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/foliodesk/portal/prospects/${dealId}?error=${encodeURIComponent(errorMessage(err, "Failed to submit appeal"))}`, getBaseUrl(req)),
      303
    );
  }
}
