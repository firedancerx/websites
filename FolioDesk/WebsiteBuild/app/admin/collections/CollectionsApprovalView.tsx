"use client";

import { useState, useMemo } from "react";
import type { CollectionRecord } from "../../../lib/funnel";
import ToggleTestModeButton from "../ToggleTestModeButton";

export default function CollectionsApprovalView({
  collections,
}: {
  collections: CollectionRecord[];
}) {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal States
  const [approveCollection, setApproveCollection] = useState<CollectionRecord | null>(null);
  const [rejectCollection, setRejectCollection] = useState<CollectionRecord | null>(null);

  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      if (activeTab === "PENDING" && c.approval_status !== "PENDING_APPROVAL") return false;
      if (activeTab === "APPROVED" && c.approval_status !== "APPROVED") return false;
      if (activeTab === "REJECTED" && c.approval_status !== "REJECTED") return false;

      if (searchQuery.trim()) {
        const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        const text = [
          c.invoice_number,
          c.bank_receipt_ref,
          c.customer_name,
          c.deal_code,
          c.affiliate_legal_name,
          c.affiliate_code,
          c.approval_status,
          c.approval_remarks,
          c.approver_name,
          c.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!terms.every((t) => text.includes(t))) return false;
      }

      return true;
    });
  }, [collections, activeTab, searchQuery]);

  const totalCollected = collections
    .filter((c) => c.approval_status === "APPROVED")
    .reduce((sum, c) => sum + Number(c.collected_amount_myr || 0), 0);

  const totalPending = collections
    .filter((c) => c.approval_status === "PENDING_APPROVAL")
    .reduce((sum, c) => sum + Number(c.collected_amount_myr || 0), 0);

  return (
    <>
      {/* METRICS BANNER */}
      <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 24 }}>
        <div className="stat">
          <small>Total Collections Logged</small>
          <strong>{collections.length}</strong>
        </div>
        <div className="stat" style={{ background: "#fffbeb", border: "1.5px solid #fde68a" }}>
          <small style={{ color: "#92400e", fontWeight: 700 }}>Awaiting Mgt Approval</small>
          <strong style={{ color: "#b45309" }}>
            RM {totalPending.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
          <span style={{ fontSize: 11, color: "#78350f" }}>
            ({collections.filter((c) => c.approval_status === "PENDING_APPROVAL").length} collections pending review)
          </span>
        </div>
        <div className="stat" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
          <small style={{ color: "#166534", fontWeight: 700 }}>Approved & Immutable Total</small>
          <strong style={{ color: "#15803d" }}>
            RM {totalCollected.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>

      {/* SEARCH AND STATUS FILTER */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px 20px",
          borderRadius: 12,
          border: "1.5px solid #cbd5e1",
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, bank ref, customer, deal code, affiliate, approver..."
              style={{
                width: "100%",
                padding: "10px 36px 10px 14px",
                fontSize: 14,
                borderRadius: 8,
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
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "ALL", label: `All (${collections.length})` },
              { key: "PENDING", label: `⏳ Awaiting Approval (${collections.filter((c) => c.approval_status === "PENDING_APPROVAL").length})` },
              { key: "APPROVED", label: `✓ Approved & Immutable (${collections.filter((c) => c.approval_status === "APPROVED").length})` },
              { key: "REJECTED", label: `✕ Rejected (${collections.filter((c) => c.approval_status === "REJECTED").length})` },
            ].map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setActiveTab(btn.key)}
                style={{
                  background: activeTab === btn.key ? "#0f766e" : "#f1f5f9",
                  color: activeTab === btn.key ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: activeTab === btn.key ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* COLLECTIONS LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredCollections.length > 0 ? (
          filteredCollections.map((c) => {
            const isPending = c.approval_status === "PENDING_APPROVAL";
            const isApproved = c.approval_status === "APPROVED";
            const isRejected = c.approval_status === "REJECTED";

            return (
              <div
                key={c.id}
                className="admin-card"
                style={{
                  padding: "18px 22px",
                  borderRadius: 10,
                  border: isPending ? "1.5px solid #fde68a" : isApproved ? "1px solid #bbf7d0" : "1px solid #fecaca",
                  background: isPending ? "#fffef9" : "#ffffff",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.6fr 1.4fr 1.2fr auto", gap: 16, alignItems: "center" }}>
                  {/* COLLECTION & INVOICE DETAILS */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <b style={{ color: "#7c3aed", fontSize: 14 }}>{c.invoice_number}</b>
                      <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 700 }}>{c.deal_code}</span>
                      {c.is_immutable === 1 && (
                        <span style={{ fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          🔒 IMMUTABLE
                        </span>
                      )}
                      {c.is_test === 1 && (
                        <span
                          className="badge"
                          style={{
                            fontSize: 11,
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

                    <h3 style={{ fontSize: 16, margin: "2px 0 2px", color: "#0f172a" }}>
                      {c.customer_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                      Bank Receipt Ref: <b>{c.bank_receipt_ref}</b> · {new Date(c.collection_date).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                    </p>

                    {c.proof_media_path && (
                      <div style={{ marginTop: 6 }}>
                        <a
                          href={c.proof_media_path}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#2563eb",
                            textDecoration: "none",
                            background: "#eff6ff",
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          📄 View Uploaded Payment Proof
                        </a>
                      </div>
                    )}
                  </div>

                  {/* INTRODUCING AFFILIATE */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Introducing Affiliate</small>
                    <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: 14, color: "#0f766e" }}>
                      {c.affiliate_legal_name}
                    </p>
                    <small style={{ color: "#64748b" }}>Code: {c.affiliate_code}</small>
                  </div>

                  {/* COLLECTED AMOUNT & LOCKED RATES */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Collected Amount</small>
                    <p style={{ margin: "2px 0 2px", fontWeight: 800, fontSize: 17, color: isApproved ? "#15803d" : "#0f172a" }}>
                      RM {Number(c.collected_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </p>
                    <div style={{ fontSize: 11, color: "#475569", background: "#f8fafc", padding: "4px 6px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                      <b>Locked Rates:</b> Direct {Number(c.locked_direct_rate_pct).toFixed(1)}% · L1 {Number(c.locked_upline_l1_rate_pct).toFixed(1)}% · L2 {Number(c.locked_upline_l2_rate_pct).toFixed(1)}%
                    </div>
                  </div>

                  {/* APPROVAL STATUS */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Management Approval</small>
                    <div style={{ marginTop: 2 }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: isApproved ? "#dcfce7" : isPending ? "#fef3c7" : "#fee2e2",
                          color: isApproved ? "#166534" : isPending ? "#92400e" : "#991b1b",
                          border: isApproved ? "1px solid #bbf7d0" : isPending ? "1px solid #fde68a" : "1px solid #fca5a5",
                        }}
                      >
                        {isApproved ? "✓ APPROVED (SEALED)" : isPending ? "⏳ AWAITING APPROVAL" : "✕ REJECTED"}
                      </span>
                    </div>

                    {isApproved && c.approved_at && (
                      <small style={{ color: "#166534", display: "block", marginTop: 2 }}>
                        By {c.approver_name || "Mgt"} on {new Date(c.approved_at).toLocaleDateString("en-MY", { dateStyle: "short" })}
                      </small>
                    )}

                    {isRejected && c.approval_remarks && (
                      <small style={{ color: "#991b1b", display: "block", marginTop: 2 }}>
                        Remarks: {c.approval_remarks}
                      </small>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
                      <ToggleTestModeButton entityType="collection" entityId={c.id} isTest={c.is_test} size="sm" />
                      {isPending ? (
                        <>
                          <button
                            className="button primary"
                            style={{ fontSize: 12, padding: "6px 12px", background: "#059669", borderColor: "#047857", whiteSpace: "nowrap" }}
                            onClick={() => setApproveCollection(c)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="button secondary"
                            style={{ fontSize: 12, padding: "6px 12px", color: "#dc2626", borderColor: "#fca5a5", whiteSpace: "nowrap" }}
                            onClick={() => setRejectCollection(c)}
                          >
                            ✕ Reject
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                          {isApproved ? "Advices Generated ✓" : "Closed"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="admin-card empty" style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            No payment collections found matching current criteria.
          </div>
        )}
      </div>

      {/* 1. MODAL: APPROVE COLLECTION */}
      {approveCollection && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 540, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#059669" }}>✓ Management Approval & Acknowledgement</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Approve customer payment collection for <b>{approveCollection.customer_name}</b> (Invoice: <b>{approveCollection.invoice_number}</b>).
            </p>

            <form action={`/foliodesk/api/admin/collections/${approveCollection.id}/approve`} method="post">
              <div style={{ background: "#f0fdf4", padding: 14, borderRadius: 8, border: "1.5px solid #bbf7d0", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <small style={{ color: "#166534", fontWeight: 600 }}>Confirmed Collection Amount</small>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#15803d" }}>
                      RM {Number(approveCollection.collected_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: "#166534" }}>
                    <b>Locked Commission Rates:</b><br />
                    Direct: {Number(approveCollection.locked_direct_rate_pct).toFixed(2)}% | L1: {Number(approveCollection.locked_upline_l1_rate_pct).toFixed(2)}% | L2: {Number(approveCollection.locked_upline_l2_rate_pct).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: 12, borderRadius: 6, fontSize: 13, color: "#1e3a8a", marginBottom: 16 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>🔒 Immutability Notice:</p>
                <p style={{ margin: "4px 0 0" }}>
                  Upon approval, <b>Payment Advice vouchers will be immediately generated</b> for the affiliate and upline hierarchy using the locked rates. The entire transaction chain from cradle to grave becomes strictly immutable.
                </p>
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Management Approval Remarks</label>
                <input
                  name="approvalRemarks"
                  defaultValue="Approved and acknowledged by management. Bank receipt verified."
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setApproveCollection(null)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#059669", borderColor: "#047857", fontWeight: 700 }}>
                  Confirm Approval & Generate Advices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: REJECT COLLECTION */}
      {rejectCollection && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#dc2626" }}>✕ Reject Payment Collection</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Reject payment collection for <b>{rejectCollection.customer_name}</b> (Invoice: <b>{rejectCollection.invoice_number}</b>).
            </p>

            <form action={`/foliodesk/api/admin/collections/${rejectCollection.id}/reject`} method="post">
              <div>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Reason for Rejection *</label>
                <textarea
                  name="approvalRemarks"
                  required
                  rows={3}
                  placeholder="e.g. Bank receipt unverified, funds not reflected in corporate account..."
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setRejectCollection(null)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#dc2626", borderColor: "#b91c1c", fontWeight: 700 }}>
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
