"use client";

import { useState, useMemo, useCallback } from "react";
import ToggleTestModeButton from "../ToggleTestModeButton";

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
  is_test?: number;
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
  // T-402 (plan §7.3(2)): status of this advice's maker-checker disbursement request, if any.
  mc_request_status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | null;
}

export default function PayoutsView({
  advices,
}: {
  advices: AdviceItem[];
}) {
  const [adviceStatusFilter, setAdviceStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal States
  const [disburseAdvice, setDisburseAdvice] = useState<AdviceItem | null>(null);
  const [viewAdvice, setViewAdvice] = useState<AdviceItem | null>(null);
  // F-11 fix: disabled/loading state on the highest-risk submit button in the codebase.
  const [isSubmittingDisbursement, setIsSubmittingDisbursement] = useState(false);
  const handleDisburseSubmit = useCallback(() => {
    setIsSubmittingDisbursement(true);
  }, []);

  // Search filtering on itemized advices
  const filteredAdvices = useMemo(() => {
    return advices.filter((a) => {
      if (adviceStatusFilter === "PENDING" && a.payout_status === "PAID") return false;
      if (adviceStatusFilter === "PAID" && a.payout_status !== "PAID") return false;

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
  const pendingAdvices = advices.filter((a) => a.payout_status !== "PAID");
  const totalPending = pendingAdvices.reduce((sum, a) => sum + Number(a.commission_amount_myr || 0), 0);

  const disbursedAdvices = advices.filter((a) => a.payout_status === "PAID");
  const totalDisbursed = disbursedAdvices.reduce((sum, a) => sum + Number(a.commission_amount_myr || 0), 0);

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
      {/* SUMMARY METRICS BANNER */}
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
          <small style={{ color: "#92400e", fontWeight: 700 }}>⏳ Pending Disbursements</small>
          <strong style={{ color: "#b45309" }}>
            RM {totalPending.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
          <span style={{ fontSize: 11, color: "#78350f" }}>
            ({pendingAdvices.length} individual advice{pendingAdvices.length === 1 ? "" : "s"} awaiting payout)
          </span>
        </div>
        <div className="stat" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
          <small style={{ color: "#166534", fontWeight: 700 }}>✓ Total Settled & Disbursed</small>
          <strong style={{ color: "#15803d" }}>
            RM {totalDisbursed.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
          <span style={{ fontSize: 11, color: "#166534" }}>
            ({disbursedAdvices.length} advice{disbursedAdvices.length === 1 ? "" : "s"} paid & tracked)
          </span>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          background: "#ffffff",
          padding: "12px 16px",
          borderRadius: 10,
          marginBottom: 20,
          border: "1px solid #cbd5e1",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setAdviceStatusFilter("ALL")}
            style={{
              background: adviceStatusFilter === "ALL" ? "#0f766e" : "#f1f5f9",
              color: adviceStatusFilter === "ALL" ? "#ffffff" : "#475569",
              fontWeight: adviceStatusFilter === "ALL" ? 700 : 500,
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            All Advices ({advices.length})
          </button>
          <button
            type="button"
            onClick={() => setAdviceStatusFilter("PENDING")}
            style={{
              background: adviceStatusFilter === "PENDING" ? "#b45309" : "#f1f5f9",
              color: adviceStatusFilter === "PENDING" ? "#ffffff" : "#475569",
              fontWeight: adviceStatusFilter === "PENDING" ? 700 : 500,
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ⏳ Pending ({pendingAdvices.length})
          </button>
          <button
            type="button"
            onClick={() => setAdviceStatusFilter("PAID")}
            style={{
              background: adviceStatusFilter === "PAID" ? "#15803d" : "#f1f5f9",
              color: adviceStatusFilter === "PAID" ? "#ffffff" : "#475569",
              fontWeight: adviceStatusFilter === "PAID" ? 700 : 500,
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ✓ Disbursed ({disbursedAdvices.length})
          </button>
        </div>

        <div style={{ flex: "1 1 300px", maxWidth: 420 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by advice #, affiliate, customer, deal, invoice, bank tx ref..."
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: 13,
            }}
          />
        </div>
      </div>

      {/* ITEMIZED PAYMENT ADVICES LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredAdvices.length > 0 ? (
          filteredAdvices.map((advice) => {
            const benBadge = getBeneficiaryTypeBadge(advice.beneficiary_type);
            const isPaid = advice.payout_status === "PAID";
            // F-03 fix (plan §6.3, §7.3(2)): the old condition only excluded PAID,
            // never CANCELLED -- a cancelled advice still showed a live Disburse
            // button. isDisbursable now requires PENDING_DISBURSEMENT explicitly,
            // and additionally requires no maker-checker request already pending
            // (avoiding a duplicate submission for the same advice).
            const isCancelled = advice.payout_status === "CANCELLED";
            const isAwaitingMgtReview = advice.payout_status === "PENDING_DISBURSEMENT" && advice.mc_request_status === "PENDING";
            const isDisbursable = advice.payout_status === "PENDING_DISBURSEMENT" && advice.mc_request_status !== "PENDING";

            return (
              <div
                key={advice.id}
                className="admin-card"
                style={{
                  padding: "18px 22px",
                  borderRadius: 10,
                  border: isPaid ? "1.5px solid #bbf7d0" : "1.5px solid #fde68a",
                  background: isPaid ? "#ffffff" : "#fffefb",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.6fr 1.4fr auto", gap: 16, alignItems: "center" }}>
                  {/* ADVICE & BENEFICIARY DETAILS */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <b style={{ color: "#0f766e", fontSize: 14 }}>{advice.advice_number}</b>
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
                      {advice.is_test === 1 && (
                        <span
                          className="badge"
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: "#fffbeb",
                            color: "#b45309",
                            border: "1px solid #fde68a",
                          }}
                        >
                          🧪 TESTER DATA
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: 16, margin: "2px 0 0", color: "#0f172a" }}>
                      {advice.beneficiary_legal_name}
                    </h4>
                    <small style={{ color: "#64748b" }}>
                      Affiliate Code: <b>{advice.beneficiary_affiliate_code}</b> · {advice.beneficiary_phone}
                    </small>
                  </div>

                  {/* CUSTOMER & TRANSACTION DETAILS */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Customer & Collection Ref</small>
                    <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                      {advice.customer_name}
                    </p>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                      <span>Invoice: <b>{advice.invoice_number}</b></span> · <span>Deal: <b>{advice.deal_code}</b></span>
                    </div>
                    <small style={{ color: "#64748b", display: "block", marginTop: 2 }}>
                      Collection Date: {new Date(advice.collection_date).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                    </small>
                  </div>

                  {/* COMMISSION SUM & DISBURSEMENT STATUS */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Net Commission Sum</small>
                    <p style={{ margin: "2px 0 2px", fontWeight: 800, fontSize: 17, color: isPaid ? "#15803d" : "#b45309" }}>
                      RM {Number(advice.commission_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </p>
                    <div style={{ fontSize: 11, color: "#475569" }}>
                      Rate: {Number(advice.rate_percentage).toFixed(2)}% of RM {Number(advice.collection_amount_base_myr).toLocaleString("en-MY")}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: isPaid ? "#dcfce7" : isCancelled ? "#fee2e2" : isAwaitingMgtReview ? "#ede9fe" : "#fef3c7",
                          color: isPaid ? "#166534" : isCancelled ? "#991b1b" : isAwaitingMgtReview ? "#5b21b6" : "#92400e",
                          border: isPaid ? "1px solid #bbf7d0" : isCancelled ? "1px solid #fca5a5" : isAwaitingMgtReview ? "1px solid #ddd6fe" : "1px solid #fde68a",
                        }}
                      >
                        {isPaid
                          ? "✓ DISBURSED / SETTLED"
                          : isCancelled
                          ? "✕ CANCELLED"
                          : isAwaitingMgtReview
                          ? "🔎 PENDING MANAGEMENT REVIEW"
                          : "⏳ PENDING DISBURSEMENT"}
                      </span>
                    </div>
                    {isPaid && advice.manual_bank_tx_ref && (
                      <small style={{ color: "#166534", fontWeight: 700, display: "block", marginTop: 4 }}>
                        Bank Ref: {advice.manual_bank_tx_ref}
                      </small>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
                    <ToggleTestModeButton entityType="payment_advice" entityId={advice.id} isTest={advice.is_test} size="sm" />
                    
                    {isDisbursable && (
                      <button
                        className="button primary"
                        style={{ fontSize: 12, padding: "5px 12px", background: "#059669", borderColor: "#047857", whiteSpace: "nowrap" }}
                        onClick={() => setDisburseAdvice(advice)}
                      >
                        📤 Submit for Disbursement
                      </button>
                    )}
                    {isAwaitingMgtReview && (
                      <span style={{ fontSize: 12, color: "#5b21b6", fontWeight: 600, whiteSpace: "nowrap" }}>
                        Awaiting Management decision
                      </span>
                    )}

                    <button
                      className="button secondary"
                      style={{ fontSize: 12, padding: "5px 10px", whiteSpace: "nowrap" }}
                      onClick={() => setViewAdvice(advice)}
                    >
                      📄 View Advice
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="admin-card empty" style={{ textAlign: "center", padding: 30, color: "#64748b" }}>
            No payment advices match your search criteria.
          </div>
        )}
      </div>

      {/* DISBURSE INDIVIDUAL PAYMENT ADVICE MODAL */}
      {disburseAdvice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 520,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              border: "1.5px solid #059669",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span className="badge" style={{ background: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: 11 }}>
                  INDIVIDUAL DISBURSEMENT RECORD
                </span>
                <h3 style={{ fontSize: 18, margin: "4px 0 0", color: "#0f172a" }}>
                  Submit Payment Advice #{disburseAdvice.advice_number} for Disbursement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDisburseAdvice(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#f0fdf4", padding: 14, borderRadius: 8, border: "1px solid #bbf7d0", marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#166534" }}>Beneficiary Partner:</span>
                <strong style={{ fontSize: 14, color: "#0f172a" }}>{disburseAdvice.beneficiary_legal_name} ({disburseAdvice.beneficiary_affiliate_code})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#166534" }}>Customer / Invoice:</span>
                <span style={{ fontSize: 13, color: "#334155" }}>{disburseAdvice.customer_name} (Inv: {disburseAdvice.invoice_number})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px dashed #bbf7d0" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Net Payable Sum:</span>
                <strong style={{ fontSize: 18, color: "#15803d" }}>
                  RM {Number(disburseAdvice.commission_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <form
              action={`/foliodesk/api/admin/payouts/${disburseAdvice.id}`}
              method="post"
              onSubmit={handleDisburseSubmit}
            >
              <input type="hidden" name="action" value="SETTLE_PAYOUT" />

              <div style={{ background: "#ede9fe", border: "1px solid #ddd6fe", padding: 12, borderRadius: 8, fontSize: 13, color: "#5b21b6", marginBottom: 14 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>🔎 Maker-Checker Notice:</p>
                <p style={{ margin: "4px 0 0" }}>
                  This submits a request to a Management user. The advice is <b>not marked PAID</b> until Management approves.
                  You (the submitting Admin) cannot also act as the approving Management user for this same request.
                </p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#0f172a" }}>
                  Bank Settlement Proof / Transaction Reference <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  name="manualBankTxRef"
                  required
                  placeholder="e.g. DUITNOW 1234 2345 or MBB-REF-998812"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
                <small style={{ color: "#64748b", marginTop: 2, display: "block" }}>
                  Enter DuitNow, Instant Transfer, or Giro bank reference number.
                </small>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#0f172a" }}>
                  Disbursement Notes / Remarks
                </label>
                <textarea
                  name="payoutNotes"
                  rows={3}
                  placeholder="Optional notes or bank transaction details..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => { setDisburseAdvice(null); setIsSubmittingDisbursement(false); }}
                  disabled={isSubmittingDisbursement}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={isSubmittingDisbursement}
                  style={{
                    background: "#059669",
                    borderColor: "#047857",
                    fontWeight: 700,
                    opacity: isSubmittingDisbursement ? 0.6 : 1,
                    cursor: isSubmittingDisbursement ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmittingDisbursement ? "Submitting…" : "📤 Submit for Management Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INDIVIDUAL PAYMENT ADVICE VOUCHER MODAL */}
      {viewAdvice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 28,
              maxWidth: 680,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              border: "1.5px solid #cbd5e1",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 12, borderBottom: "2px solid #e2e8f0" }}>
              <div>
                <small style={{ color: "#0f766e", fontWeight: 700, letterSpacing: "1px" }}>
                  FOLIODESK OFFICIAL VOUCHER
                </small>
                <h2 style={{ fontSize: 22, margin: "2px 0 0", color: "#0f172a" }}>
                  Payment Advice #{viewAdvice.advice_number}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewAdvice(null)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {/* VOUCHER STATUS BANNER */}
            <div
              style={{
                background: viewAdvice.payout_status === "PAID" ? "#f0fdf4" : "#fffbeb",
                border: viewAdvice.payout_status === "PAID" ? "1px solid #bbf7d0" : "1px solid #fde68a",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  className="badge"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: viewAdvice.payout_status === "PAID" ? "#dcfce7" : "#fef3c7",
                    color: viewAdvice.payout_status === "PAID" ? "#166534" : "#92400e",
                  }}
                >
                  {viewAdvice.payout_status === "PAID" ? "✓ DISBURSED & SETTLED" : "⏳ PENDING DISBURSEMENT"}
                </span>
                {viewAdvice.manual_bank_tx_ref && (
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#166534", fontWeight: 600 }}>
                    Bank Settlement Proof Ref: <b>{viewAdvice.manual_bank_tx_ref}</b>
                  </p>
                )}
              </div>
              {viewAdvice.paid_at && (
                <small style={{ color: "#475569" }}>
                  Disbursed: {new Date(viewAdvice.paid_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                </small>
              )}
            </div>

            {/* BENEFICIARY & TRANSACTION GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <small style={{ color: "#64748b", fontWeight: 700 }}>BENEFICIARY PARTNER</small>
                <h4 style={{ fontSize: 16, margin: "4px 0 2px", color: "#0f172a" }}>
                  {viewAdvice.beneficiary_legal_name}
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
                  Code: <b>{viewAdvice.beneficiary_affiliate_code}</b>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#475569" }}>
                  Phone: {viewAdvice.beneficiary_phone}
                </p>
              </div>

              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <small style={{ color: "#64748b", fontWeight: 700 }}>SOURCE TRANSACTION</small>
                <h4 style={{ fontSize: 16, margin: "4px 0 2px", color: "#0f172a" }}>
                  {viewAdvice.customer_name}
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
                  Invoice: <b>{viewAdvice.invoice_number}</b> · Deal: <b>{viewAdvice.deal_code}</b>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#475569" }}>
                  Collection Date: {new Date(viewAdvice.collection_date).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                </p>
              </div>
            </div>

            {/* FINANCIAL BREAKDOWN TABLE */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#334155" }}>
                    <th style={{ padding: "10px 14px" }}>Commission Item Description</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Base Sum</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Rate %</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Commission Sum</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "12px 14px" }}>
                      <b>{getBeneficiaryTypeBadge(viewAdvice.beneficiary_type).label}</b>
                      <br />
                      <small style={{ color: "#64748b" }}>Earned on collection for invoice {viewAdvice.invoice_number}</small>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      RM {Number(viewAdvice.collection_amount_base_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700 }}>
                      {Number(viewAdvice.rate_percentage).toFixed(2)}%
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "#0f766e" }}>
                      RM {Number(viewAdvice.commission_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* FOOTER & CLOSE BUTTON */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <small style={{ color: "#64748b" }}>
                Issued on {new Date(viewAdvice.created_at).toLocaleDateString("en-MY", { dateStyle: "long" })}
              </small>
              <button
                type="button"
                className="button secondary"
                onClick={() => setViewAdvice(null)}
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
