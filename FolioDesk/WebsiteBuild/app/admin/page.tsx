import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/auth";
import { db } from "../../lib/db";
import { getAdminDataMode } from "../../lib/settings";
import AdminNav from "./AdminNav";
import AdminNetworkView, { type AffiliateItem } from "./AdminNetworkView";
import { ensureCsrfCookie } from "../../lib/csrf";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Affiliate Network & Customer Onboarding",
  robots: { index: false, follow: false },
};

export default async function Admin() {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  const dataMode = await getAdminDataMode();
  const csrfToken = await ensureCsrfCookie();
  let whereClause = "";
  if (dataMode === "TEST") {
    whereClause = "WHERE a.is_test = 1";
  } else if (dataMode === "ACTUAL") {
    whereClause = "WHERE a.is_test = 0";
  }

  const [apps] = await db().execute<DatabaseRow[]>(
    `SELECT a.*, u.email, 
      (SELECT COUNT(*) FROM deal_pipeline dp WHERE dp.affiliate_id = a.id AND dp.status IN ('LEAD_SUBMITTED', 'QUALIFIED', 'PROPOSAL_SENT', 'CONTRACT_SIGNED', 'INVOICED')) AS active_prospects_count,
      (SELECT COUNT(*) FROM deal_pipeline dp WHERE dp.affiliate_id = a.id AND dp.status IN ('PARTIAL_COLLECTED', 'FULLY_COLLECTED', 'CLIENT_ONBOARDED', 'CLOSED_WON')) AS active_clients_count,
      (SELECT COUNT(*) FROM deal_pipeline dp WHERE dp.affiliate_id = a.id AND dp.status IN ('PARTIAL_COLLECTED', 'FULLY_COLLECTED', 'CLIENT_ONBOARDED', 'CLOSED_WON')) AS customer_count,
      (SELECT COUNT(*) FROM affiliate_profile_updates pu WHERE pu.application_id = a.id AND pu.status = 'PENDING_APPROVAL') AS has_pending_profile_update
     FROM affiliate_applications a 
     JOIN users u ON u.id=a.user_id 
     ${whereClause}
     ORDER BY a.submitted_at DESC`
  );

  const sanitizedApps = JSON.parse(JSON.stringify(apps));

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME ADMIN</div>
          <h1>Affiliate Network Hierarchy & Onboardings</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
            Uplines with downline networks and directly onboarded customer metrics.
          </p>
        </div>
      </div>

      <AdminNav currentDataMode={dataMode} />

      <AdminNetworkView initialApps={sanitizedApps as AffiliateItem[]} csrfToken={csrfToken} />
    </section>
  );
}
