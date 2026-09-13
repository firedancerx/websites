import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { getCommissionSettings } from "../../../lib/settings";
import { calculateClosureDeadline } from "../../../lib/funnel";
import { getActivePackages } from "../../../lib/packages";
import ProspectsListView, { type ProspectItem } from "./ProspectsListView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Affiliate Portal | My Prospects & Sales Funnel",
  robots: { index: false, follow: false },
};

export default async function AffiliateProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [apps] = await db().execute<DatabaseRow[]>(
    "SELECT * FROM affiliate_applications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1",
    [user.id]
  );
  const a = apps[0];
  const isRetracted = a?.status === "RETRACTED" || a?.status === "RETRACTION_ACKNOWLEDGED";
  const isSuspended = user.status === "SUSPENDED" || a?.status === "SUSPENDED" || a?.status === "TERMINATED";

  const settings = await getCommissionSettings();
  const packages = await getActivePackages();
  const q = await searchParams;

  let prospects: ProspectItem[] = [];
  if (a) {
    const [dRows] = await db().execute<DatabaseResultRow<ProspectItem>[]>(
      `SELECT dp.*, 
         COALESCE((SELECT SUM(c.collected_amount_myr) FROM deal_collections c WHERE c.deal_id = dp.id AND c.approval_status='APPROVED'), 0) AS total_collected_myr,
         (SELECT COUNT(*) FROM deal_funnel_steps s WHERE s.deal_id = dp.id AND s.admin_review_status = 'PENDING_REVIEW') AS pending_steps_count
       FROM deal_pipeline dp
       WHERE dp.affiliate_id = ?
       ORDER BY dp.created_at DESC`,
      [a.id]
    );

    prospects = dRows.map((d) => {
      const deadline = calculateClosureDeadline(
        d.created_at,
        settings.closurePeriodDays || 90,
        d.extension_days_granted || 0
      );

      return {
        ...d,
        days_remaining: deadline.daysRemaining,
        is_overdue: deadline.isOverdue,
        total_days_allowed: deadline.totalDaysAllowed,
        deadline_date_str: deadline.deadlineDate.toLocaleDateString("en-MY", { dateStyle: "medium" }),
        pending_steps_count: Number(d.pending_steps_count || 0),
        total_collected_myr: Number(d.total_collected_myr || 0),
      };
    });
  }

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">AFFILIATE PORTAL</div>
          <h1>My Prospects & Sales Funnel Updates</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
            Name and register prospective clients, log your sales updates, track administrative review cycles, and monitor closure periods.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link className="button secondary" href="/portal">Back to Portal Home</Link>
        </div>
      </div>

      {q.success && (
        <div className="notice" style={{ background: "rgba(16,185,129,0.1)", borderColor: "#10b981", color: "#065f46", marginBottom: 20 }}>
          ✓ {q.success}
        </div>
      )}
      {q.error && <div className="notice error" style={{ marginBottom: 20 }}>⚠️ {q.error}</div>}

      <ProspectsListView
        prospects={prospects}
        closurePeriodDays={settings.closurePeriodDays || 90}
        isRetracted={isRetracted}
        isSuspended={isSuspended}
        packages={packages}
      />
    </section>
  );
}
