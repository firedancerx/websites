import { NextResponse } from "next/server";
import { currentUser, getBaseUrl } from "../../../../../../lib/auth";
import { db } from "../../../../../../lib/db";
import { logFunnelStep } from "../../../../../../lib/funnel";
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

  // T-503 (plan §8 item 5, §6.2 Finding 3): this route had zero affiliate-status
  // check (only login + ownership). Tightened to an explicit APPROVED allowlist
  // rather than the blocklist pattern in app/api/portal/prospects/route.ts --
  // only an affiliate in good standing may submit funnel-step updates, and an
  // allowlist fails closed against any future status value this list doesn't
  // yet know about.
  if (app.status !== "APPROVED") {
    return NextResponse.redirect(
      new URL("/foliodesk/portal/prospects?error=Your+affiliateship+is+not+active+for+submitting+funnel+updates", getBaseUrl(req)),
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

  if (deal.status === "FULLY_COLLECTED" || deal.status === "ABORTED") {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/portal/prospects/${dealId}?error=This+prospect+funnel+has+been+completed+or+closed.+Further+step+updates+are+sealed.`,
        getBaseUrl(req)
      ),
      303
    );
  }

  // Server-side validation against stage backtracking
  const STAGES_ORDER = ["LEAD_SUBMITTED", "QUALIFIED", "PROPOSAL_SENT", "CONTRACT_SIGNED", "INVOICED", "FULLY_COLLECTED"];
  function getStageIndex(status: string): number {
    const idx = STAGES_ORDER.indexOf(status);
    if (idx !== -1) return idx;
    if (status === "PARTIAL_COLLECTED") return 4;
    if (status === "SUSPENDED_EFFORT") return 2;
    return 0;
  }

  const dealStatusIdx = getStageIndex(deal.status);
  const [ackSteps] = await db().execute<DatabaseRow[]>(
    "SELECT to_stage FROM deal_funnel_steps WHERE deal_id=? AND admin_review_status='ACKNOWLEDGED'",
    [dealId]
  );
  let maxAckIdx = -1;
  if (ackSteps.length > 0) {
    maxAckIdx = Math.max(...ackSteps.map((s) => getStageIndex(s.to_stage)));
  }
  const effectiveApprovedIdx = Math.max(dealStatusIdx, maxAckIdx);

  if (effectiveApprovedIdx >= 0 && STAGES_ORDER.includes(toStage)) {
    const requestedIdx = getStageIndex(toStage);
    if (requestedIdx < effectiveApprovedIdx) {
      return NextResponse.redirect(
        new URL(
          `/foliodesk/portal/prospects/${dealId}?error=Backtracking+to+a+previous+stage+is+not+permitted+once+a+stage+has+passed+admin+review+or+been+collected.`,
          getBaseUrl(req)
        ),
        303
      );
    }
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
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/foliodesk/portal/prospects/${dealId}?error=${encodeURIComponent(errorMessage(err, "Failed to log step"))}`, getBaseUrl(req)),
      303
    );
  }
}
