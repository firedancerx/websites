import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/auth";
import { db } from "../../lib/db";
import AdminNav from "./AdminNav";
import AdminNetworkView, { type AffiliateItem } from "./AdminNetworkView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Affiliate Network & Customer Onboarding",
  robots: { index: false, follow: false },
};

export default async function Admin() {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  const [apps] = await db().execute<any[]>(
    `SELECT a.*, u.email, 
      (SELECT COUNT(*) FROM onboarded_customers c WHERE c.affiliate_id = a.id) AS customer_count 
     FROM affiliate_applications a 
     JOIN users u ON u.id=a.user_id 
     ORDER BY a.submitted_at DESC`
  );

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
        <form action="/foliodesk/api/logout" method="post">
          <button className="button secondary">Sign out</button>
        </form>
      </div>

      <AdminNav />

      <AdminNetworkView initialApps={apps as AffiliateItem[]} />
    </section>
  );
}
