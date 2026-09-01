"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { FunnelStatus } from "../../../lib/funnel";

export interface DealItem {
  id: number;
  affiliate_id: number;
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
  invoiced_at: string | null;
  created_at: string;
  updated_at: string;
  affiliate_legal_name: string;
  affiliate_code: string;
  total_collected_myr: number;
}

export interface AffiliateOption {
  id: number;
  legal_name: string;
  affiliate_code: string;
}

export default function DealsView({
  deals,
  affiliates,
}: {
  deals: DealItem[];
  affiliates: AffiliateOption[];
}) {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [suspendDeal, setSuspendDeal] = useState<DealItem | null>(null);
  const [abortDeal, setAbortDeal] = useState<DealItem | null>(null);
  const [invoiceDeal, setInvoiceDeal] = useState<DealItem | null>(null);
  const [collectDeal, setCollectDeal] = useState<DealItem | null>(null);

  // Filter deals based on tab and search query
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      // Tab matching
      if (activeTab === "LEADS" && !["LEAD_SUBMITTED", "QUALIFIED"].includes(d.status)) return false;
      if (activeTab === "PROPOSAL" && d.status !== "PROPOSAL_SENT") return false;
      if (activeTab === "SUSPENDED" && d.status !== "SUSPENDED_EFFORT") return false;
      if (activeTab === "CONTRACT_SIGNED" && d.status !== "CONTRACT_SIGNED") return false;
      if (activeTab === "INVOICED_COLLECTED" && !["INVOICED", "PARTIAL_COLLECTED", "FULLY_COLLECTED"].includes(d.status)) return false;
      if (activeTab === "ABORTED" && !["ABORTED", "UNCOLLECTIBLE"].includes(d.status)) return false;

      // Search matching
      if (searchQuery.trim()) {
        const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        const text = [
          d.deal_code,
          d.customer_name,
          d.customer_email,
          d.customer_phone,
          d.package_name,
          d.status,
          d.affiliate_legal_name,
          d.affiliate_code,
          d.invoice_number,
          d.suspended_reason,
          d.aborted_reason,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!terms.every((t) => text.includes(t))) return false;
      }

      return true;
    });
  }, [deals, activeTab, searchQuery]);

  // Aggregate Metrics
  const totalValue = deals.reduce((sum, d) => sum + Number(d.contract_value_myr || 0), 0);
  const totalCollected = deals.reduce((sum, d) => sum + Number(d.total_collected_myr || 0), 0);
  const activePipelineValue = deals
    .filter((d) => !["ABORTED", "UNCOLLECTIBLE"].includes(d.status))
    .reduce((sum, d) => sum + Number(d.contract_value_myr || 0), 0);

  function getStatusBadgeStyle(status: FunnelStatus) {
    switch (status) {
      case "LEAD_SUBMITTED":
        return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
      case "QUALIFIED":
        return { bg: "#e0e7ff", color: "#3730a3", border: "#c7d2fe" };
      case "PROPOSAL_SENT":
        return { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" };
      case "SUSPENDED_EFFORT":
        return { bg: "#fef3c7", color: "#92400e", border: "#fde68a" };
      case "CONTRACT_SIGNED":
        return { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" };
      case "INVOICED":
        return { bg: "#f3e8ff", color: "#6b21a8", border: "#e9d5ff" };
      case "PARTIAL_COLLECTED":
        return { bg: "#ccfbf1", color: "#0f766e", border: "#99f6e4" };
      case "FULLY_COLLECTED":
        return { bg: "#10b981", color: "#ffffff", border: "#059669" };
      case "ABORTED":
        return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
      case "UNCOLLECTIBLE":
        return { bg: "#ffe4e6", color: "#9f1239", border: "#fecdd3" };
      default:
        return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
    }
  }

  return (
    <>
      {/* METRICS BANNER */}
      <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 24 }}>
        <div className="stat">
          <small>Total Pipeline Deals</small>
          <strong>{deals.length}</strong>
        </div>
        <div className="stat" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
          <small style={{ color: "#1e40af", fontWeight: 700 }}>Active Funnel Value</small>
          <strong style={{ color: "#1d4ed8" }}>
            RM {activePipelineValue.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="stat" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
          <small style={{ color: "#166534", fontWeight: 700 }}>Total Collected to Date</small>
          <strong style={{ color: "#15803d" }}>
            RM {totalCollected.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="stat">
          <small>Suspended Efforts</small>
          <strong style={{ color: "#d97706" }}>
            {deals.filter((d) => d.status === "SUSPENDED_EFFORT").length}
          </strong>
        </div>
        <div className="stat">
          <small>Signed Contracts</small>
          <strong style={{ color: "#0f766e" }}>
            {deals.filter((d) => ["CONTRACT_SIGNED", "INVOICED", "PARTIAL_COLLECTED", "FULLY_COLLECTED"].includes(d.status)).length}
          </strong>
        </div>
        <div className="stat">
          <small>Aborted / Dropped</small>
          <strong style={{ color: "#991b1b" }}>
            {deals.filter((d) => ["ABORTED", "UNCOLLECTIBLE"].includes(d.status)).length}
          </strong>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
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
          {/* SEARCH INPUT */}
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, deal code, affiliate, invoice #, package, reason..."
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

          <button
            className="button primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
          >
            <span>➕</span> Log New Deal
          </button>
        </div>

        {/* FUNNEL STAGE FILTER TABS */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
          {[
            { key: "ALL", label: `All Deals (${deals.length})` },
            { key: "LEADS", label: `Leads & Qualified (${deals.filter((d) => ["LEAD_SUBMITTED", "QUALIFIED"].includes(d.status)).length})` },
            { key: "PROPOSAL", label: `Proposals (${deals.filter((d) => d.status === "PROPOSAL_SENT").length})` },
            { key: "SUSPENDED", label: `Suspended (${deals.filter((d) => d.status === "SUSPENDED_EFFORT").length})` },
            { key: "CONTRACT_SIGNED", label: `Signed Contracts (${deals.filter((d) => d.status === "CONTRACT_SIGNED").length})` },
            { key: "INVOICED_COLLECTED", label: `Invoiced & Collections (${deals.filter((d) => ["INVOICED", "PARTIAL_COLLECTED", "FULLY_COLLECTED"].includes(d.status)).length})` },
            { key: "ABORTED", label: `Aborted (${deals.filter((d) => ["ABORTED", "UNCOLLECTIBLE"].includes(d.status)).length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? "#0f766e" : "#f1f5f9",
                color: activeTab === tab.key ? "#ffffff" : "#475569",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: activeTab === tab.key ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DEALS TABLE / CARDS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => {
            const badge = getStatusBadgeStyle(deal.status);
            const remainingBalance = Math.max(0, Number(deal.contract_value_myr) - Number(deal.total_collected_myr || 0));

            return (
              <div
                key={deal.id}
                className="admin-card"
                style={{
                  padding: "16px 20px",
                  borderRadius: 10,
                  border: deal.status === "SUSPENDED_EFFORT" ? "1.5px solid #fde68a" : deal.status === "ABORTED" ? "1.5px solid #fecaca" : "1px solid #e2e8f0",
                  background: deal.status === "SUSPENDED_EFFORT" ? "#fffdf5" : deal.status === "ABORTED" ? "#fefefe" : "#ffffff",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.6fr 1.2fr 1.2fr auto", gap: 16, alignItems: "center" }}>
                  {/* CUSTOMER & DEAL HEADER */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#2563eb" }}>{deal.deal_code}</span>
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
                        {deal.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 16, margin: "2px 0 4px", color: "#0f172a" }}>
                      {deal.customer_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                      {deal.customer_email} {deal.customer_phone ? `· ${deal.customer_phone}` : ""}
                    </p>

                    {deal.status === "SUSPENDED_EFFORT" && deal.suspended_reason && (
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "#b45309", background: "#fef3c7", padding: "4px 8px", borderRadius: 4 }}>
                        ⏸️ <b>Suspension Reason:</b> {deal.suspended_reason}
                      </p>
                    )}

                    {deal.status === "ABORTED" && deal.aborted_reason && (
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "#991b1b", background: "#fee2e2", padding: "4px 8px", borderRadius: 4 }}>
                        🛑 <b>Abortion Reason:</b> {deal.aborted_reason}
                      </p>
                    )}
                  </div>

                  {/* INTRODUCING AFFILIATE */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Introducing Affiliate</small>
                    <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: 14, color: "#0f766e" }}>
                      {deal.affiliate_legal_name}
                    </p>
                    <small style={{ color: "#64748b" }}>Code: {deal.affiliate_code}</small>
                  </div>

                  {/* CONTRACT VALUE & PACKAGE */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Package & Contract Value</small>
                    <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                      RM {Number(deal.contract_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </p>
                    <small style={{ color: "#475569" }}>{deal.package_name}</small>
                  </div>

                  {/* COLLECTION PROGRESS */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Collection Progress</small>
                    <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 14, color: Number(deal.total_collected_myr) > 0 ? "#166534" : "#64748b" }}>
                      RM {Number(deal.total_collected_myr || 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })} Collected
                    </p>
                    {remainingBalance > 0 && Number(deal.total_collected_myr) > 0 && (
                      <small style={{ color: "#d97706", fontWeight: 600 }}>
                        RM {remainingBalance.toLocaleString("en-MY", { minimumFractionDigits: 2 })} remaining
                      </small>
                    )}
                    {deal.invoice_number && (
                      <div><small style={{ color: "#6b21a8", fontWeight: 600 }}>Inv: {deal.invoice_number}</small></div>
                    )}
                  </div>

                  {/* STAGE PROGRESSION & ACTION BUTTONS */}
                  <div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link
                        href={`/admin/deals/${deal.id}`}
                        className="button secondary"
                        style={{ fontSize: 12, padding: "5px 10px", fontWeight: 700, borderColor: "#0f766e", color: "#0f766e" }}
                      >
                        🗺️ Steps & Review
                      </Link>

                      {deal.status === "LEAD_SUBMITTED" && (
                        <form action="/foliodesk/api/admin/deals" method="post">
                          <input type="hidden" name="action" value="UPDATE_STATUS" />
                          <input type="hidden" name="dealId" value={deal.id} />
                          <input type="hidden" name="targetStatus" value="QUALIFIED" />
                          <button className="button secondary" style={{ fontSize: 12, padding: "5px 10px" }}>
                            ✓ Qualify
                          </button>
                        </form>
                      )}

                      {deal.status === "QUALIFIED" && (
                        <form action="/foliodesk/api/admin/deals" method="post">
                          <input type="hidden" name="action" value="UPDATE_STATUS" />
                          <input type="hidden" name="dealId" value={deal.id} />
                          <input type="hidden" name="targetStatus" value="PROPOSAL_SENT" />
                          <button className="button secondary" style={{ fontSize: 12, padding: "5px 10px" }}>
                            📤 Send Proposal
                          </button>
                        </form>
                      )}

                      {["QUALIFIED", "PROPOSAL_SENT"].includes(deal.status) && (
                        <button
                          className="button secondary"
                          style={{ fontSize: 12, padding: "5px 10px", color: "#b45309", borderColor: "#fde68a" }}
                          onClick={() => setSuspendDeal(deal)}
                        >
                          ⏸️ Suspend
                        </button>
                      )}

                      {deal.status === "SUSPENDED_EFFORT" && (
                        <form action="/foliodesk/api/admin/deals" method="post">
                          <input type="hidden" name="action" value="UPDATE_STATUS" />
                          <input type="hidden" name="dealId" value={deal.id} />
                          <input type="hidden" name="targetStatus" value="PROPOSAL_SENT" />
                          <input type="hidden" name="statusNote" value="Efforts resumed with prospective client" />
                          <button className="button secondary" style={{ fontSize: 12, padding: "5px 10px", color: "#0f766e" }}>
                            ▶️ Resume Efforts
                          </button>
                        </form>
                      )}

                      {["LEAD_SUBMITTED", "QUALIFIED", "PROPOSAL_SENT", "SUSPENDED_EFFORT"].includes(deal.status) && (
                        <button
                          className="button secondary"
                          style={{ fontSize: 12, padding: "5px 10px", color: "#dc2626", borderColor: "#fecaca" }}
                          onClick={() => setAbortDeal(deal)}
                        >
                          🛑 Abort
                        </button>
                      )}

                      {deal.status === "PROPOSAL_SENT" && (
                        <form action="/foliodesk/api/admin/deals" method="post">
                          <input type="hidden" name="action" value="UPDATE_STATUS" />
                          <input type="hidden" name="dealId" value={deal.id} />
                          <input type="hidden" name="targetStatus" value="CONTRACT_SIGNED" />
                          <button className="button primary" style={{ fontSize: 12, padding: "5px 10px" }}>
                            📝 Sign Contract
                          </button>
                        </form>
                      )}

                      {deal.status === "CONTRACT_SIGNED" && (
                        <button
                          className="button primary"
                          style={{ fontSize: 12, padding: "5px 10px", background: "#7c3aed", borderColor: "#6d28d9" }}
                          onClick={() => setInvoiceDeal(deal)}
                        >
                          📄 Issue Invoice
                        </button>
                      )}

                      {["INVOICED", "PARTIAL_COLLECTED"].includes(deal.status) && (
                        <button
                          className="button primary"
                          style={{ fontSize: 12, padding: "5px 10px", background: "#059669", borderColor: "#047857" }}
                          onClick={() => setCollectDeal(deal)}
                        >
                          💰 Record Collection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="admin-card empty" style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            No deals found matching current criteria.
          </div>
        )}
      </div>

      {/* 1. MODAL: ADD / INTRODUCE NEW DEAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 540, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 20 }}>➕ Log New Opportunity / Lead</h3>
            <form action="/foliodesk/api/admin/deals" method="post">
              <input type="hidden" name="action" value="CREATE_DEAL" />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Introducing Affiliate *</label>
                  <select name="affiliateId" required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}>
                    <option value="">Select introducing affiliate...</option>
                    {affiliates.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.legal_name} ({a.affiliate_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Customer Company / Legal Name *</label>
                  <input name="customerName" required placeholder="e.g. Pembinaan Mega Maju Sdn Bhd" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Customer Email *</label>
                    <input name="customerEmail" type="email" required placeholder="procurement@megamaju.my" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Customer Phone</label>
                    <input name="customerPhone" placeholder="+60 12-345 6789" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>FolioDesk Package</label>
                    <input name="packageName" defaultValue="FolioDesk Cloud Enterprise" required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Est. Contract Value (MYR) *</label>
                    <input name="contractValueMyr" type="number" step="0.01" defaultValue="60000.00" required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontWeight: 700 }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Initial Funnel Stage</label>
                  <select name="status" defaultValue="LEAD_SUBMITTED" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}>
                    <option value="LEAD_SUBMITTED">1. Lead / Prospect</option>
                    <option value="QUALIFIED">2. Qualified Opportunity</option>
                    <option value="PROPOSAL_SENT">3. Proposal / Demo Sent</option>
                    <option value="CONTRACT_SIGNED">4. Contract Signed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="button primary">Create Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: SUSPEND EFFORTS */}
      {suspendDeal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, padding: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#b45309" }}>⏸️ Suspend Sales Efforts</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Temporarily place <b>{suspendDeal.customer_name}</b> on hold.
            </p>
            <form action="/foliodesk/api/admin/deals" method="post">
              <input type="hidden" name="action" value="UPDATE_STATUS" />
              <input type="hidden" name="dealId" value={suspendDeal.id} />
              <input type="hidden" name="targetStatus" value="SUSPENDED_EFFORT" />

              <div>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Reason for Suspension *</label>
                <textarea
                  name="suspendedReason"
                  required
                  rows={3}
                  placeholder="e.g. Client budget review postponed to Q3, procurement committee frozen..."
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
                <button type="button" className="button secondary" onClick={() => setSuspendDeal(null)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#d97706", borderColor: "#b45309" }}>Confirm Suspension</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL: ABORT OPPORTUNITY */}
      {abortDeal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, padding: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#991b1b" }}>🛑 Abort / Drop Opportunity</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Mark deal with <b>{abortDeal.customer_name}</b> as aborted/lost.
            </p>
            <form action="/foliodesk/api/admin/deals" method="post">
              <input type="hidden" name="action" value="UPDATE_STATUS" />
              <input type="hidden" name="dealId" value={abortDeal.id} />
              <input type="hidden" name="targetStatus" value="ABORTED" />

              <div>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Reason for Abortion *</label>
                <textarea
                  name="abortedReason"
                  required
                  rows={3}
                  placeholder="e.g. Selected competitor solution, client project cancelled, budget defunded..."
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
                <button type="button" className="button secondary" onClick={() => setAbortDeal(null)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#dc2626", borderColor: "#b91c1c" }}>Confirm Abortion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: ISSUE INVOICE */}
      {invoiceDeal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, padding: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#7c3aed" }}>📄 Issue Official Invoice</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Issue invoice for <b>{invoiceDeal.customer_name}</b> (Contract Value: RM {Number(invoiceDeal.contract_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}).
            </p>
            <form action="/foliodesk/api/admin/deals" method="post">
              <input type="hidden" name="action" value="UPDATE_STATUS" />
              <input type="hidden" name="dealId" value={invoiceDeal.id} />
              <input type="hidden" name="targetStatus" value="INVOICED" />

              <div>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Tax Invoice Number *</label>
                <input
                  name="invoiceNumber"
                  required
                  placeholder="e.g. INV-2026-0891"
                  defaultValue={`INV-${new Date().getFullYear()}-${String(invoiceDeal.id).padStart(4, "0")}`}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4, fontWeight: 700 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
                <button type="button" className="button secondary" onClick={() => setInvoiceDeal(null)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#7c3aed", borderColor: "#6d28d9" }}>Confirm Invoice Issued</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: RECORD PAYMENT COLLECTION */}
      {collectDeal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 520, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#059669" }}>💰 Record Customer Payment Collection</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Customer: <b>{collectDeal.customer_name}</b> · Contract Total: <b>RM {Number(collectDeal.contract_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</b>
            </p>

            <form action={`/foliodesk/api/admin/deals/${collectDeal.id}/collect`} method="post" encType="multipart/form-data">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Invoice Number *</label>
                    <input
                      name="invoiceNumber"
                      required
                      defaultValue={collectDeal.invoice_number || `INV-${new Date().getFullYear()}-${String(collectDeal.id).padStart(4, "0")}`}
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Invoice Total (MYR) *</label>
                    <input
                      name="invoiceTotalMyr"
                      type="number"
                      step="0.01"
                      required
                      defaultValue={Number(collectDeal.contract_value_myr).toFixed(2)}
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div style={{ background: "#f0fdf4", padding: 14, borderRadius: 8, border: "1.5px solid #bbf7d0" }}>
                  <label htmlFor="collectedAmountMyr" style={{ fontWeight: 700, fontSize: 14, color: "#166534" }}>
                    Actual Collected Amount (MYR) *
                  </label>
                  <p style={{ margin: "2px 0 8px", fontSize: 12, color: "#15803d" }}>
                    Commission entitlement will be locked and calculated on this confirmed amount.
                  </p>
                  <input
                    id="collectedAmountMyr"
                    name="collectedAmountMyr"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={Math.max(0, Number(collectDeal.contract_value_myr) - Number(collectDeal.total_collected_myr || 0)).toFixed(2)}
                    style={{ width: "100%", padding: "10px 12px", fontSize: 18, fontWeight: 800, borderRadius: 6, border: "2px solid #16a34a", color: "#166534" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Bank Receipt / Transaction Ref *</label>
                    <input
                      name="bankReceiptRef"
                      required
                      placeholder="e.g. MBB-983190234"
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Collection Date *</label>
                    <input
                      name="collectionDate"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Upload Proof of Payment (Optional - PDF / PNG / JPG)</label>
                  <input
                    type="file"
                    name="proofFile"
                    accept="image/*,application/pdf"
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 13 }}
                  />
                </div>

                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: 10, borderRadius: 6, fontSize: 12, color: "#1e3a8a" }}>
                  🔒 <b>Rate Locking & Management Approval:</b> Submitting will lock the current active commission rates to this collection record. Payment Advices will be generated immediately once approved by Management.
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="isFinalCollection" name="isFinalCollection" value="1" defaultChecked={true} />
                  <label htmlFor="isFinalCollection" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
                    This is the final collection (100% balance cleared for this invoice/contract)
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setCollectDeal(null)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#059669", borderColor: "#047857", fontWeight: 700 }}>
                  Submit for Management Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
