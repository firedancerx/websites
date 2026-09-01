import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { db } from "../../../lib/db";
import AdminNav from "../AdminNav";
import PayoutsView, {
  type AdviceItem,
  type ConsolidatedAffiliatePending,
} from "./PayoutsView";
import type { PayoutBatchRecord } from "../../../lib/funnel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Payment Advices & Consolidated Disbursements",
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

  // 1. Query all payment advices
  const [advices] = await db().execute<any[]>(
    `SELECT pa.*,
       a.legal_name AS beneficiary_legal_name,
       a.affiliate_code AS beneficiary_affiliate_code,
       a.phone AS beneficiary_phone,
       dp.deal_code,
       dp.customer_name,
       dc.invoice_number,
       dc.bank_receipt_ref,
       dc.collection_date,
       pb.batch_code
     FROM payment_advices pa
     JOIN affiliate_applications a ON a.id = pa.beneficiary_affiliate_id
     JOIN deal_pipeline dp ON dp.id = pa.deal_id
     JOIN deal_collections dc ON dc.id = pa.collection_id
     LEFT JOIN payout_batches pb ON pb.id = pa.payout_batch_id
     ORDER BY pa.created_at DESC`
  );

  // 2. Query consolidated pending balances grouped by affiliate
  const [consolidatedPending] = await db().execute<any[]>(
    `SELECT 
       a.id AS beneficiary_affiliate_id,
       a.legal_name AS beneficiary_legal_name,
       a.affiliate_code AS beneficiary_affiliate_code,
       a.phone AS beneficiary_phone,
       COUNT(pa.id) AS pending_advice_count,
       COALESCE(SUM(CASE WHEN pa.beneficiary_type = 'DIRECT_AFFILIATE' THEN pa.commission_amount_myr ELSE 0 END), 0) AS total_direct_comm_myr,
       COALESCE(SUM(CASE WHEN pa.beneficiary_type != 'DIRECT_AFFILIATE' THEN pa.commission_amount_myr ELSE 0 END), 0) AS total_override_comm_myr,
       SUM(pa.commission_amount_myr) AS total_pending_myr
     FROM payment_advices pa
     JOIN affiliate_applications a ON a.id = pa.beneficiary_affiliate_id
     WHERE pa.payout_status = 'PENDING_DISBURSEMENT'
     GROUP BY a.id, a.legal_name, a.affiliate_code, a.phone
     ORDER BY total_pending_myr DESC`
  );

  // 3. Query all disbursed payout batches
  const [batches] = await db().execute<any[]>(
    `SELECT pb.*,
       a.legal_name AS beneficiary_legal_name,
       a.affiliate_code AS beneficiary_affiliate_code,
       a.phone AS beneficiary_phone,
       u.full_name AS disburser_name
     FROM payout_batches pb
     JOIN affiliate_applications a ON a.id = pb.beneficiary_affiliate_id
     JOIN users u ON u.id = pb.disbursed_by
     ORDER BY pb.disbursed_at DESC`
  );

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME ADMIN</div>
          <h1>Payment Advices & Consolidated Disbursements</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
            Settle pending affiliate commission vouchers individually or execute 1-click consolidated single bank transfers per affiliate.
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

      <PayoutsView
        advices={advices as AdviceItem[]}
        batches={batches as PayoutBatchRecord[]}
        consolidatedPending={consolidatedPending as ConsolidatedAffiliatePending[]}
      />
    </section>
  );
}
