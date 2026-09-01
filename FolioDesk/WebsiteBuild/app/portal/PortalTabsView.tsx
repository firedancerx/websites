"use client";

import { useState } from "react";
import Link from "next/link";
import type { FunnelStatus, PayoutBatchRecord } from "../../lib/funnel";

export interface PortalDealItem {
  id: number;
  deal_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  package_name: string;
  package_count: number;
  contract_value_myr: number;
  status: FunnelStatus;
  status_note: string | null;
  suspended_reason: string | null;
  aborted_reason: string | null;
  signed_date: string | null;
  invoice_number: string | null;
  created_at: string;
  total_collected_myr: number;
}

export interface PortalAdviceItem {
  id: number;
  advice_number: string;
  collection_id: number;
  deal_id: number;
  beneficiary_type: "DIRECT_AFFILIATE" | "UPLINE_L1" | "UPLINE_L2";
  rate_percentage: number;
  collection_amount_base_myr: number;
  commission_amount_myr: number;
  payout_status: "PENDING_DISBURSEMENT" | "PAID" | "CANCELLED";
  paid_at: string | null;
  manual_bank_tx_ref: string | null;
  payout_notes: string | null;
  payout_batch_id: number | null;
  created_at: string;
  deal_code: string;
  customer_name: string;
  invoice_number: string;
  bank_receipt_ref: string;
  collection_date: string;
}

export default function PortalTabsView({
  deals,
  advices,
  batches = [],
  isRetracted,
  isSuspended,
  affiliateId,
  children,
}: {
  deals: PortalDealItem[];
  advices: PortalAdviceItem[];
  batches?: PayoutBatchRecord[];
  isRetracted: boolean;
  isSuspended: boolean;
  affiliateId?: number;
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"PROFILE" | "PIPELINE" | "ADVICES">("PROFILE");
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [viewAdvice, setViewAdvice] = useState<PortalAdviceItem | null>(null);
  const [viewBatch, setViewBatch] = useState<PayoutBatchRecord | null>(null);

  const totalDirectComm = advices
    .filter((a) => a.beneficiary_type === "DIRECT_AFFILIATE")
    .reduce((sum, a) => sum + Number(a.commission_amount_myr || 0), 0);

  const totalOverrideComm = advices
    .filter((a) => a.beneficiary_type !== "DIRECT_AFFILIATE")
    .reduce((sum, a) => sum + Number(a.commission_amount_myr || 0), 0);

  const totalPaidComm = advices
    .filter((a) => a.payout_status === "PAID")
    .reduce((sum, a) => sum + Number(a.commission_amount_myr || 0), 0);

  const totalPendingComm = advices
    .filter((a) => a.payout_status === "PENDING_DISBURSEMENT")
    .reduce((sum, a) => sum + Number(a.commission_amount_myr || 0), 0);

  function getStatusBadgeStyle(status: FunnelStatus) {
    switch (status) {
      case "LEAD_SUBMITTED":
        return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: "Lead Submitted" };
      case "QUALIFIED":
        return { bg: "#e0e7ff", color: "#3730a3", border: "#c7d2fe", label: "Qualified Opportunity" };
      case "PROPOSAL_SENT":
        return { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe", label: "Proposal / Demo Sent" };
      case "SUSPENDED_EFFORT":
        return { bg: "#fef3c7", color: "#92400e", border: "#fde68a", label: "Efforts Suspended" };
      case "CONTRACT_SIGNED":
        return { bg: "#dcfce7", color: "#166534", border: "#bbf7d0", label: "Contract Signed" };
      case "INVOICED":
        return { bg: "#f3e8ff", color: "#6b21a8", border: "#e9d5ff", label: "Invoice Issued" };
      case "PARTIAL_COLLECTED":
        return { bg: "#ccfbf1", color: "#0f766e", border: "#99f6e4", label: "Partial Collection" };
      case "FULLY_COLLECTED":
        return { bg: "#10b981", color: "#ffffff", border: "#059669", label: "Fully Collected" };
      case "ABORTED":
        return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", label: "Opportunity Aborted" };
      case "UNCOLLECTIBLE":
        return { bg: "#ffe4e6", color: "#9f1239", border: "#fecdd3", label: "Uncollectible / Bad Debt" };
      default:
        return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: status };
    }
  }

  return (
    <div>
      {/* PORTAL NAVIGATION TABS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          background: "#f1f5f9",
          padding: "6px",
          borderRadius: 10,
          marginBottom: 24,
          border: "1px solid #e2e8f0",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("PROFILE")}
          style={{
            background: activeTab === "PROFILE" ? "#ffffff" : "transparent",
            color: activeTab === "PROFILE" ? "#0f766e" : "#475569",
            fontWeight: activeTab === "PROFILE" ? 700 : 500,
            padding: "8px 18px",
            borderRadius: 8,
            border: activeTab === "PROFILE" ? "1px solid #cbd5e1" : "1px solid transparent",
            boxShadow: activeTab === "PROFILE" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          👤 Profile & Affiliate Status
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PIPELINE")}
          style={{
            background: activeTab === "PIPELINE" ? "#ffffff" : "transparent",
            color: activeTab === "PIPELINE" ? "#0f766e" : "#475569",
            fontWeight: activeTab === "PIPELINE" ? 700 : 500,
            padding: "8px 18px",
            borderRadius: 8,
            border: activeTab === "PIPELINE" ? "1px solid #cbd5e1" : "1px solid transparent",
            boxShadow: activeTab === "PIPELINE" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          📊 Sales Pipeline & Deals ({deals.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ADVICES")}
          style={{
            background: activeTab === "ADVICES" ? "#ffffff" : "transparent",
            color: activeTab === "ADVICES" ? "#0f766e" : "#475569",
            fontWeight: activeTab === "ADVICES" ? 700 : 500,
            padding: "8px 18px",
            borderRadius: 8,
            border: activeTab === "ADVICES" ? "1px solid #cbd5e1" : "1px solid transparent",
            boxShadow: activeTab === "ADVICES" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          💳 Payment Advices & Payouts ({advices.length})
        </button>
      </div>

      {/* TAB 1: PROFILE & IDENTITY STATUS */}
      {activeTab === "PROFILE" && children}

      {/* TAB 2: SALES PIPELINE & DEALS */}
      {activeTab === "PIPELINE" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 22, margin: 0, color: "#0f172a" }}>
                My Introduced Clients & Sales Funnel
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
                Track the commercial progression of prospective companies you introduced to FolioDesk.
              </p>
            </div>

            {!isRetracted && !isSuspended && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href="/portal/prospects"
                  className="button secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
                >
                  <span>🗺️</span> Open Prospects Directory
                </Link>
                <button
                  className="button primary"
                  onClick={() => setIsLeadModalOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
                >
                  <span>➕</span> Introduce New Client / Lead
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {deals.length > 0 ? (
              deals.map((deal) => {
                const badge = getStatusBadgeStyle(deal.status);
                return (
                  <div
                    key={deal.id}
                    className="admin-card"
                    style={{
                      padding: "16px 20px",
                      borderRadius: 10,
                      border: deal.status === "SUSPENDED_EFFORT" ? "1.5px solid #fde68a" : deal.status === "ABORTED" ? "1.5px solid #fecaca" : "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1.1fr 1fr auto", gap: 14, alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#2563eb" }}>{deal.deal_code}</span>
                          <span
                            className="badge"
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 16, margin: "2px 0 2px", color: "#0f172a" }}>{deal.customer_name}</h3>
                        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                          {deal.customer_email} {deal.customer_phone ? `· ${deal.customer_phone}` : ""}
                        </p>

                        {deal.status === "SUSPENDED_EFFORT" && deal.suspended_reason && (
                          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#b45309", background: "#fef3c7", padding: "4px 8px", borderRadius: 4 }}>
                            ⏸️ <b>Suspension:</b> {deal.suspended_reason}
                          </p>
                        )}
                        {deal.status === "ABORTED" && deal.aborted_reason && (
                          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#991b1b", background: "#fee2e2", padding: "4px 8px", borderRadius: 4 }}>
                            🛑 <b>Status:</b> {deal.aborted_reason}
                          </p>
                        )}
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: 11 }}>Package</small>
                        <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: 14, color: "#0f766e" }}>
                          {deal.package_name}
                        </p>
                        <small style={{ color: "#64748b" }}>Qty: {deal.package_count}</small>
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: 11 }}>Contract Value</small>
                        <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 15, color: "#0f172a" }}>
                          RM {Number(deal.contract_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </p>
                        {deal.invoice_number && (
                          <small style={{ color: "#6b21a8", fontWeight: 600 }}>Inv: {deal.invoice_number}</small>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <small style={{ color: "#64748b", fontSize: 11 }}>Collected</small>
                        <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 14, color: Number(deal.total_collected_myr) > 0 ? "#166534" : "#64748b" }}>
                          RM {Number(deal.total_collected_myr || 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div>
                        <Link
                          href={`/portal/prospects/${deal.id}`}
                          className="button primary"
                          style={{ fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
                        >
                          🗺️ Sales Path
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="admin-card empty" style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>👥</span>
                No prospective clients introduced yet. Click &quot;Introduce New Client / Lead&quot; above to log your first commercial introduction.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT ADVICES & COMMISSIONS */}
      {activeTab === "ADVICES" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, margin: 0, color: "#0f172a" }}>
              Payment Advices & Consolidated Disbursements
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              Payment advice vouchers and official consolidated bank transfer receipts for your direct sales and network override earnings.
            </p>
          </div>

          {/* COMMISSION SUMMARY CARDS */}
          <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 24 }}>
            <div className="stat" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
              <small style={{ color: "#166534", fontWeight: 700 }}>Total Direct Sales Commission</small>
              <strong style={{ color: "#15803d" }}>
                RM {totalDirectComm.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="stat" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
              <small style={{ color: "#1e40af", fontWeight: 700 }}>Network Override Earnings</small>
              <strong style={{ color: "#1d4ed8" }}>
                RM {totalOverrideComm.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="stat">
              <small>Total Settled / Disbursed</small>
              <strong style={{ color: "#0f766e" }}>
                RM {totalPaidComm.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="stat" style={{ background: "#fffbeb", border: "1.5px solid #fde68a" }}>
              <small style={{ color: "#92400e", fontWeight: 700 }}>Pending Bank Transfer</small>
              <strong style={{ color: "#b45309" }}>
                RM {totalPendingComm.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* CONSOLIDATED PAYOUT BATCHES SECTION */}
          {batches.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 18, margin: "0 0 12px", color: "#0f766e", display: "flex", alignItems: "center", gap: 6 }}>
                <span>📜</span> Consolidated Payout Receipts ({batches.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="admin-card"
                    style={{
                      padding: "16px 20px",
                      borderRadius: 10,
                      border: "1.5px solid #bbf7d0",
                      background: "#f0fdf4",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.6fr 1.4fr auto", gap: 14, alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>{batch.batch_code}</span>
                        <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                          Consolidated Bank Transfer Receipt
                        </p>
                        <small style={{ color: "#64748b" }}>
                          Disbursed on {new Date(batch.disbursed_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                        </small>
                      </div>

                      <div>
                        <small style={{ color: "#166534", fontWeight: 600 }}>Bank Transaction Proof</small>
                        <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 14, color: "#0f766e" }}>
                          Ref: {batch.manual_bank_tx_ref}
                        </p>
                        {batch.bank_name && (
                          <small style={{ color: "#475569" }}>
                            {batch.bank_name} {batch.bank_account_number ? `· ${batch.bank_account_number}` : ""}
                          </small>
                        )}
                      </div>

                      <div>
                        <small style={{ color: "#166534", fontWeight: 600 }}>Total Disbursed Sum</small>
                        <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 17, color: "#15803d" }}>
                          RM {Number(batch.total_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </p>
                        <small style={{ color: "#64748b" }}>({batch.advice_count} constituent vouchers settled)</small>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <button
                          className="button secondary"
                          style={{ fontSize: 12, padding: "6px 12px", background: "#ffffff" }}
                          onClick={() => setViewBatch(batch)}
                        >
                          📄 View Consolidated Voucher
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ITEMIZED PAYMENT ADVICES */}
          <h3 style={{ fontSize: 18, margin: "0 0 12px", color: "#0f172a" }}>
            Itemized Payment Advice Vouchers ({advices.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {advices.length > 0 ? (
              advices.map((adv) => {
                const isDirect = adv.beneficiary_type === "DIRECT_AFFILIATE";
                const isPaid = adv.payout_status === "PAID";

                return (
                  <div
                    key={adv.id}
                    className="admin-card"
                    style={{
                      padding: "16px 20px",
                      borderRadius: 10,
                      border: isPaid ? "1px solid #bbf7d0" : "1.5px solid #fde68a",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.6fr 1.2fr auto", gap: 16, alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <b style={{ color: "#0f766e", fontSize: 14 }}>{adv.advice_number}</b>
                          <span
                            className="badge"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: isDirect ? "#dbeafe" : "#f3e8ff",
                              color: isDirect ? "#1e40af" : "#6b21a8",
                              border: isDirect ? "1px solid #bfdbfe" : "1px solid #e9d5ff",
                            }}
                          >
                            {isDirect ? "🎯 Direct Commission" : "🌿 Network Override"}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 16, margin: "2px 0 2px", color: "#0f172a" }}>{adv.customer_name}</h3>
                        <small style={{ color: "#64748b" }}>Invoice Ref: {adv.invoice_number} · Deal: {adv.deal_code}</small>
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: 11 }}>Customer Collection Base</small>
                        <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 14, color: "#334155" }}>
                          RM {Number(adv.collection_amount_base_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </p>
                        <small style={{ color: "#64748b" }}>Rate: {Number(adv.rate_percentage).toFixed(2)}%</small>
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: 11 }}>Net Commission Earned</small>
                        <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 16, color: "#0f766e" }}>
                          RM {Number(adv.commission_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </p>
                        <span
                          className="badge"
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: isPaid ? "#dcfce7" : "#fef3c7",
                            color: isPaid ? "#166534" : "#92400e",
                            border: isPaid ? "1px solid #bbf7d0" : "1px solid #fde68a",
                          }}
                        >
                          {isPaid ? "✓ PAID & SETTLED" : "⏳ PENDING TRANSFER"}
                        </span>
                        {isPaid && adv.manual_bank_tx_ref && (
                          <small style={{ color: "#166534", fontWeight: 600, display: "block", marginTop: 2 }}>
                            Bank Ref: {adv.manual_bank_tx_ref}
                          </small>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <button
                          className="button secondary"
                          style={{ fontSize: 12, padding: "6px 12px" }}
                          onClick={() => setViewAdvice(adv)}
                        >
                          📄 View Voucher
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="admin-card empty" style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>💳</span>
                No payment advice vouchers issued yet. Payment advices are generated automatically when client collections are approved.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: INTRODUCE NEW LEAD */}
      {isLeadModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 520, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>➕ Introduce Prospective Client</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              Enter company details for FolioDesk commercial follow-up. Commission is secured under your account.
            </p>

            <form action="/foliodesk/api/portal/leads" method="post">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Customer Company / Legal Name *</label>
                  <input name="customerName" required placeholder="e.g. Pembinaan Mega Maju Sdn Bhd" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Customer Email Address *</label>
                    <input name="customerEmail" type="email" required placeholder="contact@megamaju.my" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Contact Phone</label>
                    <input name="customerPhone" placeholder="+60 12-345 6789" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Proposed FolioDesk Package</label>
                    <input name="packageName" defaultValue="FolioDesk Cloud Enterprise" required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Est. Contract Value (MYR) *</label>
                    <input name="contractValueMyr" type="number" step="0.01" defaultValue="60000.00" required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontWeight: 700 }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Introductory Notes / Requirements</label>
                  <textarea name="notes" rows={2} placeholder="e.g. Needs ERP & Document AI for 5 ongoing construction sites in Klang Valley..." style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setIsLeadModalOpen(false)}>Cancel</button>
                <button type="submit" className="button primary" style={{ fontWeight: 700 }}>Submit Client Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: FORMAL PAYMENT ADVICE VOUCHER VIEW */}
      {viewAdvice && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 600, padding: 28, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f766e", paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#0f766e", letterSpacing: "1px" }}>FOLIODESK COMMISSIONS</span>
                <h2 style={{ fontSize: 20, margin: "2px 0 0", color: "#0f172a" }}>PAYMENT ADVICE NOTE</h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <b style={{ color: "#0f766e", fontSize: 16 }}>{viewAdvice.advice_number}</b>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                  Date: {new Date(viewAdvice.created_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                </p>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <p style={{ margin: "0 0 4px", color: "#64748b" }}>Customer: <b style={{ color: "#0f172a" }}>{viewAdvice.customer_name}</b></p>
              <p style={{ margin: "0 0 4px", color: "#64748b" }}>Invoice Reference: <b>{viewAdvice.invoice_number}</b> (Deal: {viewAdvice.deal_code})</p>
              <p style={{ margin: 0, color: "#64748b" }}>Collection Bank Reference: {viewAdvice.bank_receipt_ref}</p>
            </div>

            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 20 }}>
              <thead>
                <tr style={{ background: "#0f766e", color: "#fff", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px" }}>Entitlement Type</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Collection Base</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>Rate %</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Net Commission</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <b>{viewAdvice.beneficiary_type === "DIRECT_AFFILIATE" ? "Direct Introducer Commission" : "Network Override Commission"}</b>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    RM {Number(viewAdvice.collection_amount_base_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>
                    {Number(viewAdvice.rate_percentage).toFixed(2)}%
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#0f766e", fontSize: 15 }}>
                    RM {Number(viewAdvice.commission_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ background: viewAdvice.payout_status === "PAID" ? "#f0fdf4" : "#fffbeb", padding: 14, borderRadius: 8, border: viewAdvice.payout_status === "PAID" ? "1px solid #bbf7d0" : "1px solid #fde68a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <small style={{ color: viewAdvice.payout_status === "PAID" ? "#166534" : "#92400e", fontWeight: 700 }}>SETTLEMENT STATUS</small>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#334155" }}>
                    Status: <b>{viewAdvice.payout_status === "PAID" ? "✓ DISBURSED / PAID" : "⏳ PENDING BANK TRANSFER"}</b>
                  </p>
                  {viewAdvice.manual_bank_tx_ref && (
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#166534", fontWeight: 600 }}>
                      Bank Transfer Reference: {viewAdvice.manual_bank_tx_ref}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: viewAdvice.payout_status === "PAID" ? "#166534" : "#b45309" }}>
                    RM {Number(viewAdvice.commission_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
              <button type="button" className="button secondary" onClick={() => setViewAdvice(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FORMAL CONSOLIDATED BATCH VOUCHER VIEW */}
      {viewBatch && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 640, padding: 28, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f766e", paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#0f766e", letterSpacing: "1px" }}>FOLIODESK SDN BHD</span>
                <h2 style={{ fontSize: 20, margin: "2px 0 0", color: "#0f172a" }}>CONSOLIDATED DISBURSEMENT RECEIPT</h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <b style={{ color: "#0f766e", fontSize: 16 }}>{viewBatch.batch_code}</b>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                  Date: {new Date(viewBatch.disbursed_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                </p>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <p style={{ margin: "0 0 4px", color: "#64748b" }}>Bank Settlement Reference: <b style={{ color: "#166534" }}>{viewBatch.manual_bank_tx_ref}</b></p>
              {viewBatch.bank_name && (
                <p style={{ margin: 0, color: "#475569" }}>
                  Bank: {viewBatch.bank_name} {viewBatch.bank_account_number ? `(A/C: ${viewBatch.bank_account_number})` : ""}
                </p>
              )}
            </div>

            <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 8, border: "1.5px solid #bbf7d0", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <small style={{ color: "#166534", fontWeight: 700 }}>TOTAL RECEIVED INTO BANK</small>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#15803d", marginTop: 2 }}>
                    RM {Number(viewBatch.total_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ textAlign: "right", color: "#166534", fontSize: 12 }}>
                  <b>{viewBatch.advice_count} Payment Advices</b><br />
                  Settled in Single Bank Transfer
                </div>
              </div>
            </div>

            {viewBatch.payout_notes && (
              <p style={{ fontSize: 13, color: "#475569", background: "#f1f5f9", padding: 10, borderRadius: 6, margin: "0 0 16px" }}>
                <b>Notes:</b> {viewBatch.payout_notes}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
              <button type="button" className="button secondary" onClick={() => setViewBatch(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
