import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { getAdminDataMode } from "../../../lib/settings";
import AdminNav from "../AdminNav";
import ApprovalsView from "./ApprovalsView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Superadmin Pending Approvals & Action Center",
  robots: { index: false, follow: false },
};

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const q = (await searchParams) || {};
  const dataMode = await getAdminDataMode();

  let testFilterApp = "";
  let testFilterDeal = "";
  if (dataMode === "TEST") {
    testFilterApp = " AND a.is_test = 1";
    testFilterDeal = " AND d.is_test = 1";
  } else if (dataMode === "ACTUAL") {
    testFilterApp = " AND a.is_test = 0";
    testFilterDeal = " AND d.is_test = 0";
  }

  // 1. Pending Affiliate Applications
  const [pendingApplications] = await db().execute<any[]>(
    `SELECT a.*, u.email AS user_email 
     FROM affiliate_applications a 
     LEFT JOIN users u ON u.id = a.user_id 
     WHERE a.status = 'PENDING_REVIEW' ${testFilterApp}
     ORDER BY a.submitted_at DESC`
  );

  // 2. Pending Profile & eKYC Updates
  const [pendingProfileUpdates] = await db().execute<any[]>(
    `SELECT pu.*, a.affiliate_code, a.legal_name AS current_legal_name
     FROM affiliate_profile_updates pu
     JOIN affiliate_applications a ON a.id = pu.application_id
     WHERE pu.status IN ('PENDING_REVIEW', 'REVIEW_REQUIRED', 'PENDING_APPROVAL') ${testFilterApp}
     ORDER BY pu.created_at DESC`
  );

  // 3. Pending Payment Collections
  const [pendingCollections] = await db().execute<any[]>(
    `SELECT c.*, 
       d.deal_code, d.customer_name, d.contract_value_myr, d.invoice_number, d.package_name, d.package_count,
       a.legal_name AS affiliate_legal_name, a.affiliate_code
     FROM deal_collections c
     JOIN deal_pipeline d ON d.id = c.deal_id
     JOIN affiliate_applications a ON a.id = d.affiliate_id
     WHERE c.approval_status = 'PENDING_APPROVAL' ${testFilterDeal}
     ORDER BY c.created_at DESC`
  );

  // 4. Pending Closure Deadline Appeals
  const [pendingAppeals] = await db().execute<any[]>(
    `SELECT d.*, 
       a.legal_name AS affiliate_legal_name, a.affiliate_code, u.email AS affiliate_email
     FROM deal_pipeline d
     JOIN affiliate_applications a ON a.id = d.affiliate_id
     LEFT JOIN users u ON u.id = a.user_id
     WHERE d.appeal_status = 'APPEAL_SUBMITTED' ${testFilterDeal}
     ORDER BY d.appeal_submitted_at DESC`
  );

  // 5. Pending Deal Funnel Steps Review
  const [pendingFunnelSteps] = await db().execute<any[]>(
    `SELECT s.*, 
       d.deal_code, d.customer_name, d.status AS deal_status,
       a.legal_name AS affiliate_legal_name, a.affiliate_code
     FROM deal_funnel_steps s
     JOIN deal_pipeline d ON d.id = s.deal_id
     JOIN affiliate_applications a ON a.id = d.affiliate_id
     WHERE s.admin_review_status = 'PENDING_REVIEW' ${testFilterDeal}
     ORDER BY s.updated_at DESC, s.created_at DESC`
  );

  const totalPending =
    pendingApplications.length +
    pendingProfileUpdates.length +
    pendingCollections.length +
    pendingAppeals.length +
    pendingFunnelSteps.length;

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME SUPERADMIN</div>
          <h1 className="h2">⚡ Pending Approvals & Action Center</h1>
          <p className="subtext">
            Centralized review queue for all pending affiliate applications, profile updates, client payment collections, deadline appeals, and milestone submissions.
          </p>
        </div>
      </div>

      <AdminNav currentDataMode={dataMode} />

      {q.success && (
        <div style={{ background: "#dcfce7", color: "#166534", border: "1.5px solid #bbf7d0", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontWeight: 700 }}>
          ✓ {q.success}
        </div>
      )}
      {q.error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", border: "1.5px solid #fca5a5", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontWeight: 700 }}>
          ⚠️ {q.error}
        </div>
      )}

      <ApprovalsView
        applications={JSON.parse(JSON.stringify(pendingApplications))}
        profileUpdates={JSON.parse(JSON.stringify(pendingProfileUpdates))}
        collections={JSON.parse(JSON.stringify(pendingCollections))}
        appeals={JSON.parse(JSON.stringify(pendingAppeals))}
        steps={JSON.parse(JSON.stringify(pendingFunnelSteps))}
        totalPending={totalPending}
      />
    </section>
  );
}
