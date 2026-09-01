import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { db } from "../../../lib/db";
import AdminNav from "../AdminNav";
import CollectionsApprovalView from "./CollectionsApprovalView";
import type { CollectionRecord } from "../../../lib/funnel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Collections & Management Approval",
  robots: { index: false, follow: false },
};

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const q = await searchParams;

  const [collections] = await db().execute<any[]>(
    `SELECT dc.*,
       dp.deal_code,
       dp.customer_name,
       a.legal_name AS affiliate_legal_name,
       a.affiliate_code,
       u.full_name AS approver_name
     FROM deal_collections dc
     JOIN deal_pipeline dp ON dp.id = dc.deal_id
     JOIN affiliate_applications a ON a.id = dp.affiliate_id
     LEFT JOIN users u ON u.id = dc.approved_by
     ORDER BY dc.created_at DESC`
  );

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME ADMIN</div>
          <h1>Collections & Management Approval</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
            Review customer payment submissions, verify bank proofs, inspect locked commission rates, and grant final management approval.
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

      <CollectionsApprovalView collections={collections as CollectionRecord[]} />
    </section>
  );
}
