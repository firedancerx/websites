import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { getCommissionSettings } from "../../../../lib/settings";
import { calculateClosureDeadline, type ClosureLogRecord, type CollectionRecord, type DealRecord, type FunnelStepRecord } from "../../../../lib/funnel";
import AdminNav from "../../AdminNav";
import DealDetailView from "./DealDetailView";
import { ensureCsrfCookie } from "../../../../lib/csrf";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Deal Funnel Journey & Administrative Review",
  robots: { index: false, follow: false },
};

export default async function AdminDealDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const { id } = await params;
  const dealId = Number(id);
  const csrfToken = await ensureCsrfCookie();

  const [deals] = await db().execute<DatabaseResultRow<DealRecord>[]>(
    `SELECT dp.*,
       a.legal_name AS affiliate_legal_name,
       a.affiliate_code AS affiliate_code,
       u.email AS affiliate_email,
       COALESCE((SELECT SUM(c.collected_amount_myr) FROM deal_collections c WHERE c.deal_id = dp.id AND c.approval_status='APPROVED'), 0) AS total_collected_myr,
       (SELECT COUNT(*) FROM deal_collections c2 WHERE c2.deal_id = dp.id AND c2.is_immutable = 1) AS locked_collections_count,
       mcr.status AS mc_request_status
     FROM deal_pipeline dp
     JOIN affiliate_applications a ON a.id = dp.affiliate_id
     LEFT JOIN users u ON u.id = a.user_id
     LEFT JOIN maker_checker_requests mcr
       ON mcr.entity_type = 'deal_pipeline'
       AND mcr.entity_id = dp.id
       AND mcr.request_type = 'CLOSURE_APPEAL_ADJUDICATION'
       AND mcr.status = 'PENDING'
     WHERE dp.id = ?
     LIMIT 1`,
    [dealId]
  );
  const deal = deals[0];
  if (!deal) redirect("/admin/deals");

  const [steps] = await db().execute<DatabaseResultRow<FunnelStepRecord>[]>(
    `SELECT s.*, u.full_name AS submitter_name, r.full_name AS reviewer_name
     FROM deal_funnel_steps s
     JOIN users u ON u.id = s.submitted_by_user_id
     LEFT JOIN users r ON r.id = s.reviewed_by_user_id
     WHERE s.deal_id = ?
     ORDER BY s.submitted_at DESC`,
    [dealId]
  );

  const [closureLogs] = await db().execute<DatabaseResultRow<ClosureLogRecord>[]>(
    `SELECT l.*, u.full_name AS performer_name
     FROM deal_closure_logs l
     JOIN users u ON u.id = l.performed_by_user_id
     WHERE l.deal_id = ?
     ORDER BY l.created_at DESC`,
    [dealId]
  );

  const [collections] = await db().execute<DatabaseResultRow<CollectionRecord>[]>(
    `SELECT * FROM deal_collections WHERE deal_id=? ORDER BY created_at DESC`,
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
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME ADMIN</div>
          <h1>Prospect Funnel Journey & Administrative Review</h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link className="button secondary" href="/admin/deals">← All Deals Pipeline</Link>
        </div>
      </div>

      <AdminNav />

      {q.success && (
        <div className="notice" style={{ background: "rgba(16,185,129,0.1)", borderColor: "#10b981", color: "#065f46", marginBottom: 20 }}>
          ✓ {q.success}
        </div>
      )}
      {q.error && <div className="notice error" style={{ marginBottom: 20 }}>⚠️ {q.error}</div>}

      <DealDetailView
        deal={deal}
        steps={steps}
        closureLogs={closureLogs}
        collections={collections}
        closurePeriodDays={settings.closurePeriodDays || 90}
        daysRemaining={deadline.daysRemaining}
        isOverdue={deadline.isOverdue}
        deadlineDateStr={deadline.deadlineDate.toLocaleDateString("en-MY", { dateStyle: "medium" })}
        csrfToken={csrfToken}
      />
    </section>
  );
}
