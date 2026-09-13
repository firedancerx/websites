import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { getAdminDataMode } from "../../../lib/settings";
import AdminNav from "../AdminNav";
import InvoicesView from "./InvoicesView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Issued Tax Invoices & Collections",
  robots: { index: false, follow: false },
};

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const q = (await searchParams) || {};
  const dataMode = await getAdminDataMode();

  let dealWhereClause = "WHERE (d.invoice_number IS NOT NULL OR d.status IN ('INVOICED', 'PARTIAL_COLLECTED', 'FULLY_COLLECTED'))";
  if (dataMode === "TEST") {
    dealWhereClause += " AND d.is_test = 1";
  } else if (dataMode === "ACTUAL") {
    dealWhereClause += " AND d.is_test = 0";
  }

  const [invoices] = await db().execute<DatabaseRow[]>(
    `SELECT d.*, 
       a.legal_name AS affiliate_legal_name, 
       a.affiliate_code,
       u.email AS affiliate_email,
       COALESCE((SELECT SUM(c.collected_amount_myr) FROM deal_collections c WHERE c.deal_id = d.id AND c.approval_status = 'APPROVED'), 0) AS total_collected_myr
     FROM deal_pipeline d
     JOIN affiliate_applications a ON a.id = d.affiliate_id
     LEFT JOIN users u ON u.id = a.user_id
     ${dealWhereClause}
     ORDER BY d.updated_at DESC, d.created_at DESC`
  );

  const sanitizedInvoices = JSON.parse(JSON.stringify(invoices));

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME ADMIN</div>
          <h1 className="h2">📄 Issued Tax Invoices & Billing Management</h1>
          <p className="subtext">
            Central repository of all official tax invoices issued to client prospects or introducing partners. Record payment collections and generate printable PDF invoices.
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

      <InvoicesView invoices={sanitizedInvoices} />
    </section>
  );
}
