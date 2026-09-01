"use client";

import { useState, useMemo } from "react";
import type { PayoutBatchRecord } from "../../../lib/funnel";

export interface AdviceItem {
  id: number;
  advice_number: string;
  collection_id: number;
  deal_id: number;
  beneficiary_affiliate_id: number;
  beneficiary_type: "DIRECT_AFFILIATE" | "UPLINE_L1" | "UPLINE_L2";
  rate_percentage: number;
  collection_amount_base_myr: number;
  commission_amount_myr: number;
  payout_status: "PENDING_DISBURSEMENT" | "PAID" | "CANCELLED";
  paid_at: string | null;
  manual_bank_tx_ref: string | null;
  payout_notes: string | null;
  payout_batch_id: number | null;
  is_immutable: number;
  created_at: string;
  // Joined fields
  beneficiary_legal_name: string;
  beneficiary_affiliate_code: string;
  beneficiary_phone: string;
  deal_code: string;
  customer_name: string;
  invoice_number: string;
  bank_receipt_ref: string;
  collection_date: string;
  batch_code?: string | null;
}

export interface ConsolidatedAffiliatePending {
  beneficiary_affiliate_id: number;
  beneficiary_legal_name: string;
  beneficiary_affiliate_code: string;
  beneficiary_phone: string;
  pending_advice_count: number;
  total_direct_comm_myr: number;
  total_override_comm_myr: number;
  total_pending_myr: number;
}

export default function PayoutsView({
  advices,
  batches,
  consolidatedPending,
}: {
  advices: AdviceItem[];
  batches: PayoutBatchRecord[];
  consolidatedPending: ConsolidatedAffiliatePending[];
}) {
  const [activeMainTab, setActiveMainTab] = useState<"CONSOLIDATED" | "ITEMIZED" | "BATCHES">("CONSOLIDATED");
  const [adviceStatusFilter, setAdviceStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal States
  const [consolidateTarget, setConsolidateTarget] = useState<ConsolidatedAffiliatePending | null>(null);
  const [viewAdvice, setViewAdvice] = useState<AdviceItem | null>(null);
  const [viewBatch, setViewBatch] = useState<PayoutBatchRecord | null>(null);

  // Search filtering on itemized advices
  const filteredAdvices = useMemo(() => {
    return advices.filter((a) => {
      if (adviceStatusFilter !== "ALL" && a.payout_status !== adviceStatusFilter) return false;

      if (searchQuery.trim()) {
        const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        const text = [
          a.advice_number,
          a.beneficiary_legal_name,
          a.beneficiary_affiliate_code,
          a.deal_code,
          a.customer_name,
          a.invoice_number,
          a.bank_receipt_ref,
          a.manual_bank_tx_ref,
          a.batch_code,
          a.beneficiary_type,
          a.payout_status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!terms.every((t) => text.includes(t))) return false;
      }

      return true;
    });
  }, [advices, adviceStatusFilter, searchQuery]);

  const totalGenerated = advices.reduce((sum, a) => sum + Number(a.commission_amount_myr || 0), 0);
  const totalPending = advices
    .filter((a) => a.payout_status === "PENDING_DISBURSEMENT")
    .reduce((sum, a) => sum + Number(a.commission_amount_myr || 0), 0);
  const totalPaid = advices
    .filter((a) => a.payout_status === "PAID")
    .reduce((sum, a) => sum + Number(a.commission_amount_myr || 0), 0);

  function getBeneficiaryTypeBadge(type: string) {
    switch (type) {
      case "DIRECT_AFFILIATE":
        return { label: "🎯 Direct Commission", bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" };
      case "UPLINE_L1":
        return { label: "🌿 Upline L1 Override", bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" };
      case "UPLINE_L2":
        return { label: "🌱 Upline L2 Override", bg: "#f3e8ff", color: "#6b21a8", border: "#e9d5ff" };
      default:
        return { label: type, bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
    }
  }

  return (
    <>
      {/* METRICS BANNER */}
      <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 24 }}>
        <div className="stat">
          <small>Total Payment Advices</small>
          <strong>{advices.length}</strong>
        </div>
        <div className="stat">
          <small>Total Commission Value</small>
          <strong style={{ color: "#0f172a" }}>
            RM {totalGenerated.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="stat" style={{ background: "#fffbeb", border: "1.5px solid #fde68a" }}>
          <small style={{ color: "#92400e", fontWeight: 700 }}>Consolidated Pending Payouts</small>
          <strong style={{ color: "#b45309" }}>
            RM {totalPending.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
          <span style={{ fontSize: 11, color: "#78350f" }}>
            ({consolidatedPending.length} affiliate{consolidatedPending.length === 1 ? "" : "s"} awaiting batch transfer)
          </span>
        </div>
        <div className="stat" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
          <small style={{ color: "#166534", fontWeight: 700 }}>Total Settled & Disbursed</small>
          <strong style={{ color: "#15803d" }}>
            RM {totalPaid.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
          <span style={{ fontSize: 11, color: "#166534" }}>
            ({batches.length} batch disbursement{batches.length === 1 ? "" : "s"} executed)
          </span>
        </div>
      </div>

      {/* THREE STRUCTURED TABS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          background: "#ffffff",
          padding: "8px 12px",
          borderRadius: 10,
          marginBottom: 20,
          border: "1px solid #cbd5e1",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMainTab("CONSOLIDATED")}
          style={{
            background: activeMainTab === "CONSOLIDATED" ? "#0f766e" : "#f1f5f9",
            color: activeMainTab === "CONSOLIDATED" ? "#ffffff" : "#475569",
            fontWeight: activeMainTab === "CONSOLIDATED" ? 700 : 500,
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          👥 Consolidated by Affiliate ({consolidatedPending.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("ITEMIZED")}
          style={{
            background: activeMainTab === "ITEMIZED" ? "#0f766e" : "#f1f5f9",
            color: activeMainTab === "ITEMIZED" ? "#ffffff" : "#475569",
            fontWeight: activeMainTab === "ITEMIZED" ? 700 : 500,
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          📄 Itemized Payment Advices ({advices.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("BATCHES")}
          style={{
            background: activeMainTab === "BATCHES" ? "#0f766e" : "#f1f5f9",
            color: activeMainTab === "BATCHES" ? "#ffffff" : "#475569",
            fontWeight: activeMainTab === "BATCHES" ? 700 : 500,
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          📜 Disbursed Payout Batches ({batches.length})
        </button>
      </div>

      {/* TAB 1: CONSOLIDATED BY AFFILIATE (PENDING DISBURSEMENTS) */}
      {activeMainTab === "CONSOLIDATED" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {consolidatedPending.length > 0 ? (
            consolidatedPending.map((item) => (
              <div
                key={item.beneficiary_affiliate_id}
                className="admin-card"
                style={{
                  padding: "20px 24px",
                  borderRadius: 12,
                  border: "1.5px solid #fde68a",
                  background: "#fffef9",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.6fr 1.4fr auto", gap: 18, alignItems: "center" }}>
                  {/* BENEFICIARY DETAILS */}
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", letterSpacing: "0.5px" }}>
                      AFFILIATE ID: {item.beneficiary_affiliate_code}
                    </span>
                    <h3 style={{ fontSize: 18, margin: "2px 0 4px", color: "#0f172a" }}>
                      {item.beneficiary_legal_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                      Phone: {item.beneficiary_phone} · Pending Vouchers: <b>{item.pending_advice_count}</b>
                    </p>
                  </div>

                  {/* EARNINGS BREAKDOWN */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Earnings Composition</small>
                    <div style={{ marginTop: 2, fontSize: 13 }}>
                      <p style={{ margin: "0 0 2px", color: "#1e40af" }}>
                        🎯 Direct Sales: <b>RM {Number(item.total_direct_comm_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</b>
                      </p>
                      <p style={{ margin: 0, color: "#6b21a8" }}>
                        🌿 Overrides: <b>RM {Number(item.total_override_comm_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</b>
                      </p>
                    </div>
                  </div>

                  {/* TOTAL CONSOLIDATED SUM */}
                  <div>
                    <small style={{ color: "#92400e", fontSize: 11, fontWeight: 700 }}>Total Consolidated Balance</small>
                    <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 20, color: "#b45309" }}>
                      RM {Number(item.total_pending_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                      ⏳ Ready for 1-Click Bank Transfer
                    </span>
                  </div>

                  {/* ACTION BUTTON */}
                  <div>
                    <button
                      className="button primary"
                      style={{
                        background: "#0f766e",
                        borderColor: "#0d655e",
                        fontWeight: 700,
                        padding: "10px 18px",
                        fontSize: 13,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        whiteSpace: "nowrap",
                      }}
                      onClick={() => setConsolidateTarget(item)}
                    >
                      <span>💸</span> Disburse Consolidated Payout
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-card empty" style={{ textAlign: "center", padding: 48, color: "#64748b" }}>
              <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>✓</span>
              <b>All affiliate commissions are fully settled and up to date!</b>
              <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                New pending payouts will appear here automatically when customer collections are approved.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ITEMIZED PAYMENT ADVICES */}
      {activeMainTab === "ITEMIZED" && (
        <>
          {/* SEARCH AND STATUS FILTER */}
          <div
            style={{
              background: "#ffffff",
              padding: "14px 18px",
              borderRadius: 10,
              border: "1.5px solid #cbd5e1",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search across advice #, affiliate name, customer, deal code, invoice #, bank tx ref..."
                  style={{
                    width: "100%",
                    padding: "8px 36px 8px 12px",
                    fontSize: 13,
                    borderRadius: 6,
                    border: "1.5px solid #94a3b8",
                    outline: "none",
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      fontSize: 14,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "ALL", label: `All (${advices.length})` },
                  { key: "PENDING_DISBURSEMENT", label: `⏳ Pending (${advices.filter((a) => a.payout_status === "PENDING_DISBURSEMENT").length})` },
                  { key: "PAID", label: `✓ Paid (${advices.filter((a) => a.payout_status === "PAID").length})` },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={() => setAdviceStatusFilter(btn.key)}
                    style={{
                      background: adviceStatusFilter === btn.key ? "#0f766e" : "#f1f5f9",
                      color: adviceStatusFilter === btn.key ? "#ffffff" : "#475569",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: adviceStatusFilter === btn.key ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredAdvices.length > 0 ? (
              filteredAdvices.map((advice) => {
                const benBadge = getBeneficiaryTypeBadge(advice.beneficiary_type);
                const isPaid = advice.payout_status === "PAID";

                return (
                  <div
                    key={advice.id}
                    className="admin-card"
                    style={{
                      padding: "16px 20px",
                      borderRadius: 10,
                      border: isPaid ? "1px solid #bbf7d0" : "1.5px solid #fde68a",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.6fr 1.4fr 1.2fr auto", gap: 14, alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <b style={{ color: "#0f766e", fontSize: 13 }}>{advice.advice_number}</b>
                          <span
                            className="badge"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: benBadge.bg,
                              color: benBadge.color,
                              border: `1px solid ${benBadge.border}`,
                            }}
                          >
                            {benBadge.label}
                          </span>
                        </div>
                        <h4 style={{ fontSize: 15, margin: "2px 0 0", color: "#0f172a" }}>
                          {advice.beneficiary_legal_name}
                        </h4>
                        <small style={{ color: "#64748b" }}>Code: {advice.beneficiary_affiliate_code}</small>
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: 11 }}>Customer & Collection Ref</small>
                        <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                          {advice.customer_name}
                        </p>
                        <small style={{ color: "#475569" }}>
                          Inv: {advice.invoice_number} · Deal: {advice.deal_code}
                        </small>
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: 11 }}>Entitlement</small>
                        <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 15, color: "#0f766e" }}>
                          RM {Number(advice.commission_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </p>
                        <small style={{ color: "#64748b" }}>
                          {Number(advice.rate_percentage).toFixed(1)}% on RM {Number(advice.collection_amount_base_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </small>
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: 11 }}>Status</small>
                        <div style={{ marginTop: 2 }}>
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
                            {isPaid ? "✓ PAID" : "⏳ PENDING"}
                          </span>
                        </div>
                        {isPaid && advice.manual_bank_tx_ref && (
                          <small style={{ color: "#166534", fontWeight: 600, display: "block", marginTop: 2 }}>
                            Tx: {advice.manual_bank_tx_ref}
                          </small>
                        )}
                        {advice.batch_code && (
                          <small style={{ color: "#6b21a8", fontWeight: 600, display: "block" }}>
                            Batch: {advice.batch_code}
                          </small>
                        )}
                      </div>

                      <div>
                        <button
                          className="button secondary"
                          style={{ fontSize: 12, padding: "5px 10px" }}
                          onClick={() => setViewAdvice(advice)}
                        >
                          📄 View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="admin-card empty" style={{ textAlign: "center", padding: 30, color: "#64748b" }}>
                No payment advices found.
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 3: DISBURSED PAYOUT BATCHES */}
      {activeMainTab === "BATCHES" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {batches.length > 0 ? (
            batches.map((batch) => (
              <div
                key={batch.id}
                className="admin-card"
                style={{
                  padding: "18px 22px",
                  borderRadius: 10,
                  border: "1px solid #bbf7d0",
                  background: "#ffffff",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.6fr 1.4fr 1.2fr auto", gap: 16, alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0f766e" }}>{batch.batch_code}</span>
                    <h4 style={{ fontSize: 16, margin: "2px 0 2px", color: "#0f172a" }}>
                      {batch.beneficiary_legal_name}
                    </h4>
                    <small style={{ color: "#64748b" }}>Code: {batch.beneficiary_affiliate_code}</small>
                  </div>

                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Bank Settlement Proof</small>
                    <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 13, color: "#166534" }}>
                      Ref: {batch.manual_bank_tx_ref}
                    </p>
                    {batch.bank_name && (
                      <small style={{ color: "#475569" }}>
                        {batch.bank_name} {batch.bank_account_number ? `· ${batch.bank_account_number}` : ""}
                      </small>
                    )}
                  </div>

                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Total Disbursed Sum</small>
                    <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 16, color: "#15803d" }}>
                      RM {Number(batch.total_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </p>
                    <small style={{ color: "#64748b" }}>{batch.advice_count} constituent advice vouchers</small>
                  </div>

                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Disbursement Date</small>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#334155" }}>
                      {new Date(batch.disbursed_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                    </p>
                    <small style={{ color: "#64748b" }}>By: {batch.disburser_name || "Admin"}</small>
                  </div>

                  <div>
                    <button
                      className="button secondary"
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={() => setViewBatch(batch)}
                    >
                      📄 View Batch Voucher
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-card empty" style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
              No consolidated payout batches disbursed yet.
            </div>
          )}
        </div>
      )}

      {/* 1. MODAL: SETTLE CONSOLIDATED PAYOUT */}
      {consolidateTarget && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 540, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#0f766e" }}>💸 Disburse Consolidated Payout</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Beneficiary: <b>{consolidateTarget.beneficiary_legal_name}</b> ({consolidateTarget.beneficiary_affiliate_code})
            </p>

            <form action="/foliodesk/api/admin/payouts/batch" method="post">
              <input type="hidden" name="affiliateId" value={consolidateTarget.beneficiary_affiliate_id} />

              <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 8, border: "1.5px solid #bbf7d0", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <small style={{ color: "#166534", fontWeight: 700 }}>Total Consolidated Payment</small>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#15803d", marginTop: 2 }}>
                      RM {Number(consolidateTarget.total_pending_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: "#166534" }}>
                    <b>{consolidateTarget.pending_advice_count} Vouchers:</b><br />
                    Direct: RM {Number(consolidateTarget.total_direct_comm_myr).toFixed(2)}<br />
                    Overrides: RM {Number(itemOverride(consolidateTarget)).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Bank Transaction / Transfer Reference *</label>
                  <input
                    name="manualBankTxRef"
                    required
                    placeholder="e.g. DUITNOW-89310923 / MBB-098234"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1.5px solid #94a3b8", fontWeight: 700 }}
                  />
                  <small style={{ color: "#64748b", marginTop: 2, display: "block" }}>
                    Single transaction reference that settles all {consolidateTarget.pending_advice_count} vouchers simultaneously.
                  </small>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Bank Name</label>
                    <input
                      name="bankName"
                      placeholder="e.g. Maybank / CIMB"
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Account Number</label>
                    <input
                      name="bankAccountNumber"
                      placeholder="e.g. 5140-xxxx-xxxx"
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Disbursement Notes / Remarks</label>
                  <textarea
                    name="payoutNotes"
                    rows={2}
                    placeholder="e.g. Consolidated monthly commission payout for August 2026..."
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setConsolidateTarget(null)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#0f766e", borderColor: "#0d655e", fontWeight: 700 }}>
                  Confirm Single Batch Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: VIEW ITEMIZED PAYMENT ADVICE */}
      {viewAdvice && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 640, padding: 28, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f766e", paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#0f766e", letterSpacing: "1px" }}>FOLIODESK SDN BHD</span>
                <h2 style={{ fontSize: 22, margin: "2px 0 0", color: "#0f172a" }}>OFFICIAL PAYMENT ADVICE</h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <b style={{ color: "#0f766e", fontSize: 16 }}>{viewAdvice.advice_number}</b>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                  Date: {new Date(viewAdvice.created_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18, fontSize: 13 }}>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                <small style={{ color: "#64748b", fontWeight: 700 }}>BENEFICIARY DETAILS</small>
                <p style={{ margin: "4px 0 2px", fontWeight: 700, fontSize: 14 }}>{viewAdvice.beneficiary_legal_name}</p>
                <p style={{ margin: 0, color: "#475569" }}>Affiliate Code: <b>{viewAdvice.beneficiary_affiliate_code}</b></p>
                <p style={{ margin: 0, color: "#475569" }}>Type: {viewAdvice.beneficiary_type.replaceAll("_", " ")}</p>
              </div>

              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                <small style={{ color: "#64748b", fontWeight: 700 }}>COLLECTION SOURCE</small>
                <p style={{ margin: "4px 0 2px", fontWeight: 700, fontSize: 14 }}>{viewAdvice.customer_name}</p>
                <p style={{ margin: 0, color: "#475569" }}>Invoice No: <b>{viewAdvice.invoice_number}</b></p>
                <p style={{ margin: 0, color: "#475569" }}>Bank Ref: {viewAdvice.bank_receipt_ref}</p>
              </div>
            </div>

            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 20 }}>
              <thead>
                <tr style={{ background: "#0f766e", color: "#fff", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px" }}>Description</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Collection Base</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>Rate %</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Net Commission</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <b>{viewAdvice.beneficiary_type === "DIRECT_AFFILIATE" ? "Direct Introducing Commission" : "Network Override Commission"}</b>
                    <br />
                    <small style={{ color: "#64748b" }}>Deal Code: {viewAdvice.deal_code}</small>
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
                  <small style={{ color: viewAdvice.payout_status === "PAID" ? "#166534" : "#92400e", fontWeight: 700 }}>PAYMENT SETTLEMENT</small>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#334155" }}>
                    Status: <b>{viewAdvice.payout_status === "PAID" ? "PAID (Settled)" : "PENDING MANUAL BANK TRANSFER"}</b>
                  </p>
                  {viewAdvice.manual_bank_tx_ref && (
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#166534", fontWeight: 600 }}>
                      Bank Transfer Ref: {viewAdvice.manual_bank_tx_ref}
                    </p>
                  )}
                  {viewAdvice.batch_code && (
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b21a8", fontWeight: 600 }}>
                      Consolidated Batch: {viewAdvice.batch_code}
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

      {/* 3. MODAL: VIEW CONSOLIDATED BATCH VOUCHER */}
      {viewBatch && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 660, padding: 28, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f766e", paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#0f766e", letterSpacing: "1px" }}>FOLIODESK SDN BHD</span>
                <h2 style={{ fontSize: 22, margin: "2px 0 0", color: "#0f172a" }}>CONSOLIDATED DISBURSEMENT VOUCHER</h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <b style={{ color: "#0f766e", fontSize: 16 }}>{viewBatch.batch_code}</b>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                  Date: {new Date(viewBatch.disbursed_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                </p>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <small style={{ color: "#64748b", fontWeight: 700 }}>BENEFICIARY</small>
                  <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{viewBatch.beneficiary_legal_name}</p>
                  <p style={{ margin: 0, color: "#475569" }}>Affiliate Code: <b>{viewBatch.beneficiary_affiliate_code}</b></p>
                </div>
                <div>
                  <small style={{ color: "#64748b", fontWeight: 700 }}>BANK SETTLEMENT PROOF</small>
                  <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 14, color: "#166534" }}>Ref: {viewBatch.manual_bank_tx_ref}</p>
                  {viewBatch.bank_name && <p style={{ margin: 0, color: "#475569" }}>{viewBatch.bank_name} {viewBatch.bank_account_number || ""}</p>}
                </div>
              </div>
            </div>

            <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 8, border: "1.5px solid #bbf7d0", marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <small style={{ color: "#166534", fontWeight: 700 }}>TOTAL DISBURSED AMOUNT</small>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#15803d", marginTop: 2 }}>
                    RM {Number(viewBatch.total_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ textAlign: "right", color: "#166534", fontSize: 13 }}>
                  <b>{viewBatch.advice_count} Payment Advice Vouchers</b><br />
                  Settled in 1 Single Transaction
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
    </>
  );
}

function itemOverride(item: ConsolidatedAffiliatePending) {
  return Number(item.total_override_comm_myr || 0);
}
