import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { db } from "../../../lib/db";
import AdminNav from "../AdminNav";
import DealsView, { type DealItem, type AffiliateOption } from "./DealsView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Sales Funnel & Deal Pipeline",
  robots: { index: false, follow: false },
};

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const q = await searchParams;

  const [deals] = await db().execute<any[]>(
    `SELECT d.*, 
       a.legal_name AS affiliate_legal_name, 
       a.affiliate_code,
       COALESCE((SELECT SUM(c.collected_amount_myr) FROM deal_collections c WHERE c.deal_id = d.id), 0) AS total_collected_myr
     FROM deal_pipeline d
     JOIN affiliate_applications a ON a.id = d.affiliate_id
     ORDER BY d.created_at DESC`
  );

  const [affiliates] = await db().execute<any[]>(
    `SELECT id, legal_name, affiliate_code 
     FROM affiliate_applications 
     WHERE status='APPROVED' OR affiliate_code IS NOT NULL 
     ORDER BY legal_name ASC`
  );

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME ADMIN</div>
          <h1>Sales Funnel Progression & Deal Pipeline</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
            Track opportunities from lead submission, suspension, and abortion through contract signing, invoicing, and collections.
          </p>
        </div>
        <form action="/foliodesk/api/logout" method="post">
          <button className="button secondary">Sign out</button>
        </form>
      </div>

      <AdminNav />

      {q.success && (
        <div className="notice" style={{ background: "rgba(16,185,129,0.1)", borderColor: "#10b981", color: "#065f46", marginBottom: 20 }}>
          ✓ {q.success}
        </div>
      )}
      {q.error && <div className="notice error" style={{ marginBottom: 20 }}>⚠️ {q.error}</div>}

      <DealsView
        deals={deals as DealItem[]}
        affiliates={affiliates as AffiliateOption[]}
      />
    </section>
  );
}
