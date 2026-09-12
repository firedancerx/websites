import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { getCommissionSettings } from "../../../../lib/settings";
import { calculateClosureDeadline } from "../../../../lib/funnel";
import ProspectJourneyView from "./ProspectJourneyView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Affiliate Portal | Prospect Funnel Journey",
  robots: { index: false, follow: false },
};

export default async function AffiliateProspectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const dealId = Number(id);

  const [apps] = await db().execute<any[]>(
    "SELECT id FROM affiliate_applications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1",
    [user.id]
  );
  const a = apps[0];
  if (!a) redirect("/portal");

  const [deals] = await db().execute<any[]>(
    "SELECT * FROM deal_pipeline WHERE id=? AND affiliate_id=? LIMIT 1",
    [dealId, a.id]
  );
  const deal = deals[0];
  if (!deal) redirect("/portal/prospects");

  const [steps] = await db().execute<any[]>(
    `SELECT s.*, u.full_name AS submitter_name, r.full_name AS reviewer_name
     FROM deal_funnel_steps s
     JOIN users u ON u.id = s.submitted_by_user_id
     LEFT JOIN users r ON r.id = s.reviewed_by_user_id
     WHERE s.deal_id = ?
     ORDER BY s.submitted_at DESC`,
    [dealId]
  );

  const [closureLogs] = await db().execute<any[]>(
    `SELECT l.*, u.full_name AS performer_name
     FROM deal_closure_logs l
     JOIN users u ON u.id = l.performed_by_user_id
     WHERE l.deal_id = ?
     ORDER BY l.created_at DESC`,
    [dealId]
  );

  const settings = await getCommissionSettings();
  const deadline = calculateClosureDeadline(
    deal.created_at,
    settings.closurePeriodDays || 90,
    deal.extension_days_granted || 0
  );

  const q = await searchParams;

  return (
    <section className="admin-wrap" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">AFFILIATE PORTAL</div>
          <h1>Prospect Sales Funnel Journey</h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link className="button secondary" href="/portal/prospects">← All My Prospects</Link>
        </div>
      </div>

      {q.success && (
        <div className="notice" style={{ background: "rgba(16,185,129,0.1)", borderColor: "#10b981", color: "#065f46", marginBottom: 20 }}>
          ✓ {q.success}
        </div>
      )}
      {q.error && <div className="notice error" style={{ marginBottom: 20 }}>⚠️ {q.error}</div>}

      <ProspectJourneyView
        deal={deal}
        steps={steps}
        closureLogs={closureLogs}
        closurePeriodDays={settings.closurePeriodDays || 90}
        daysRemaining={deadline.daysRemaining}
        isOverdue={deadline.isOverdue}
        deadlineDateStr={deadline.deadlineDate.toLocaleDateString("en-MY", { dateStyle: "medium" })}
      />
    </section>
  );
}
