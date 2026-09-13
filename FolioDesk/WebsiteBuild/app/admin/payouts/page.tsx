import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { getAdminDataMode } from "../../../lib/settings";
import AdminNav from "../AdminNav";
import PayoutsView, { type AdviceItem } from "./PayoutsView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Payment Advices & Individual Disbursements",
  robots: { index: false, follow: false },
};

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const q = await searchParams;
  const dataMode = await getAdminDataMode();

  let adviceWhere = "";
  if (dataMode === "TEST") {
    adviceWhere = "WHERE pa.is_test = 1";
  } else if (dataMode === "ACTUAL") {
    adviceWhere = "WHERE pa.is_test = 0";
  }

  // Query all payment advices with beneficiary affiliate & collection details
  const [advices] = await db().execute<DatabaseRow[]>(
    `SELECT pa.*,
       a.legal_name AS beneficiary_legal_name,
       a.affiliate_code AS beneficiary_affiliate_code,
       a.phone AS beneficiary_phone,
       dp.deal_code,
       dp.customer_name,
       dc.invoice_number,
       dc.bank_receipt_ref,
       dc.collection_date
     FROM payment_advices pa
     JOIN affiliate_applications a ON a.id = pa.beneficiary_affiliate_id
     JOIN deal_pipeline dp ON dp.id = pa.deal_id
     JOIN deal_collections dc ON dc.id = pa.collection_id
     ${adviceWhere}
     ORDER BY pa.created_at DESC`
  );

  const sanitizedAdvices = JSON.parse(JSON.stringify(advices));

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME ADMIN</div>
          <h1>Payment Advices & Individual Disbursements</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
            All affiliate commission payments are advised, disbursed, and tracked individually per collection transaction.
          </p>
        </div>
      </div>

      <AdminNav currentDataMode={dataMode} />

      {q.success && (
        <div className="notice" style={{ background: "rgba(16,185,129,0.1)", borderColor: "#10b981", color: "#065f46", marginBottom: 20 }}>
          ✓ {q.success}
        </div>
      )}
      {q.error && <div className="notice error" style={{ marginBottom: 20 }}>⚠️ {q.error}</div>}

      <PayoutsView advices={sanitizedAdvices as AdviceItem[]} />
    </section>
  );
}
