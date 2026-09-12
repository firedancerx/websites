"use client";

import { useState } from "react";
import Link from "next/link";
import type { FunnelStatus, PayoutBatchRecord } from "../../lib/funnel";
import type { PackageItem } from "../../lib/packages";
import InvoiceDocumentModal from "../components/InvoiceDocumentModal";
import CopyReferralLink from "./CopyReferralLink";
import PackageSelectForm, { ValidatedContactInputs } from "../components/PackageSelectForm";

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
  invoice_target?: "PROSPECT" | "AFFILIATE" | null;
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
  affiliateCode,
  packages = [],
  initialTab = "PIPELINE",
  children,
}: {
  deals: PortalDealItem[];
  advices: PortalAdviceItem[];
  batches?: PayoutBatchRecord[];
  isRetracted: boolean;
  isSuspended: boolean;
  affiliateId?: number;
  affiliateCode?: string;
  packages?: PackageItem[];
  initialTab?: "PROFILE" | "PIPELINE" | "INVOICES" | "ADVICES";
  children?: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"PROFILE" | "PIPELINE" | "INVOICES" | "ADVICES">(initialTab);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [viewAdvice, setViewAdvice] = useState<PortalAdviceItem | null>(null);
  const [viewBatch, setViewBatch] = useState<PayoutBatchRecord | null>(null);
  const [viewInvoiceDeal, setViewInvoiceDeal] = useState<PortalDealItem | null>(null);

  const issuedDeals = deals.filter((d) => Boolean(d.invoice_number) || ["INVOICED", "PARTIAL_COLLECTED", "FULLY_COLLECTED"].includes(d.status));

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
          onClick={() => setActiveTab("INVOICES")}
          style={{
            background: activeTab === "INVOICES" ? "#ffffff" : "transparent",
            color: activeTab === "INVOICES" ? "#0f766e" : "#475569",
            fontWeight: activeTab === "INVOICES" ? 700 : 500,
            padding: "8px 18px",
            borderRadius: 8,
            border: activeTab === "INVOICES" ? "1px solid #cbd5e1" : "1px solid transparent",
            boxShadow: activeTab === "INVOICES" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          📄 Issued Tax Invoices ({issuedDeals.length})
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

      {affiliateCode && !isRetracted && !isSuspended && (
        <CopyReferralLink affiliateCode={affiliateCode} />
      )}

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
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setActiveTab("PROFILE")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
                >
                  <span>👤</span> My Profile
                </button>
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

      {/* TAB 3: ISSUED TAX INVOICES */}
      {activeTab === "INVOICES" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, margin: 0, color: "#0f172a" }}>
              Issued Tax Invoices & Billing Records
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              Official FolioDesk Tax Invoices issued for your client contracts. View, download as A4 PDF, or send directly to client billing representatives.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {issuedDeals.length > 0 ? (
              issuedDeals.map((deal) => {
                const contractVal = Number(deal.contract_value_myr || 0);
                const collectedVal = Number(deal.total_collected_myr || 0);
                const balanceDue = Math.max(0, contractVal - collectedVal);
                const isFullyPaid = balanceDue <= 0.01 || deal.status === "FULLY_COLLECTED";
                const isPartial = collectedVal > 0 && balanceDue > 0.01;
                const isBilledToAffiliate = deal.invoice_target === "AFFILIATE";
                const invoiceNumber = deal.invoice_number || `INV-2026-${String(deal.id).padStart(4, "0")}`;

                return (
                  <div
                    key={deal.id}
                    className="admin-card"
                    style={{
                      padding: "20px 24px",
                      borderRadius: 12,
                      border: "1.5px solid #e2e8f0",
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.6fr 1.2fr 1fr auto", gap: 16, alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#6b21a8" }}>{invoiceNumber}</span>
                          <span style={{ fontSize: 11, background: isBilledToAffiliate ? "#f3e8ff" : "#e0f2fe", color: isBilledToAffiliate ? "#6b21a8" : "#0369a1", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                            {isBilledToAffiliate ? "Billed to Partner" : "Billed to Client"}
                          </span>
                        </div>
                        <h4 style={{ margin: "4px 0 2px", fontSize: 16, color: "#0f172a" }}>
                          {deal.customer_name}
                        </h4>
                        <small style={{ color: "#64748b" }}>
                          Ref Code: {deal.deal_code} · {deal.package_name} ({deal.package_count} units)
                        </small>
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: 11 }}>Financial Summary</small>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                          Invoice Total: RM {contractVal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: 12, color: "#166534" }}>
                          Collected: RM {collectedVal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: 11 }}>Balance Due</small>
                        <div style={{ fontSize: 15, fontWeight: 800, color: balanceDue > 0 ? "#991b1b" : "#166534", marginTop: 2 }}>
                          RM {balanceDue.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        {isFullyPaid ? (
                          <span style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                            ✓ PAID IN FULL
                          </span>
                        ) : isPartial ? (
                          <span style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                            ⏳ PARTIALLY PAID
                          </span>
                        ) : (
                          <span style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                            ⚠️ UNCOLLECTED
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setViewInvoiceDeal(deal)}
                          style={{
                            background: "#6b21a8",
                            color: "#ffffff",
                            border: "none",
                            padding: "8px 14px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          📄 View / Print Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="admin-card empty" style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>📄</span>
                No official tax invoices issued yet for your introduced clients. Invoices are generated by FolioDesk Admin upon contract execution.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT ADVICES & COMMISSIONS */}
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

          {/* ITEMIZED PAYMENT ADVICES */}
          <h3 style={{ fontSize: 18, margin: "0 0 12px", color: "#0f172a" }}>
            Payment Advice Vouchers ({advices.length})
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

                <ValidatedContactInputs />

                <PackageSelectForm packages={packages} />

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
      {/* MODAL: VIEW INVOICE DOCUMENT */}
      {viewInvoiceDeal && (
        <InvoiceDocumentModal
          deal={{
            ...viewInvoiceDeal,
            affiliate_legal_name: (viewInvoiceDeal as any).affiliate_legal_name || "N/A",
            affiliate_code: (viewInvoiceDeal as any).affiliate_code || "N/A",
            affiliate_email: (viewInvoiceDeal as any).affiliate_email || viewInvoiceDeal.customer_email,
            invoice_target: viewInvoiceDeal.invoice_target || "PROSPECT",
            total_collected_myr: viewInvoiceDeal.total_collected_myr || 0,
          }}
          onClose={() => setViewInvoiceDeal(null)}
        />
      )}
    </div>
  );
}
