"use client";

import { useState } from "react";
import Link from "next/link";
import type { FunnelStatus, AppealStatus } from "../../../lib/funnel";
import type { PackageItem } from "../../../lib/packages";
import PackageSelectForm, { ValidatedContactInputs } from "../../components/PackageSelectForm";

export interface ProspectItem {
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
  created_at: string;
  extension_days_granted: number;
  is_force_closed: number;
  force_closed_at: string | null;
  force_closed_reason: string | null;
  appeal_status: AppealStatus;
  appeal_reason: string | null;
  is_test?: number;
  // Computed fields
  days_remaining: number;
  is_overdue: boolean;
  total_days_allowed: number;
  deadline_date_str: string;
  pending_steps_count: number;
  total_collected_myr: number;
}

export default function ProspectsListView({
  prospects,
  isRetracted,
  isSuspended,
  packages = [],
}: {
  prospects: ProspectItem[];
  closurePeriodDays: number;
  isRetracted: boolean;
  isSuspended: boolean;
  packages?: PackageItem[];
}) {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = prospects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const text = [
      p.deal_code,
      p.customer_name,
      p.customer_email,
      p.customer_phone,
      p.status,
      p.package_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return terms.every((t) => text.includes(t));
  });

  function getStageBadge(status: FunnelStatus, isForceClosed: number, appealStatus: AppealStatus) {
    if (isForceClosed === 1 && appealStatus === "APPEAL_SUBMITTED") {
      return { bg: "#fef3c7", color: "#92400e", border: "#fde68a", label: "⚖️ Under Appeal" };
    }
    if (isForceClosed === 1) {
      return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", label: "🛑 Force Closed" };
    }

    switch (status) {
      case "LEAD_SUBMITTED":
        return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: "Lead Registered" };
      case "QUALIFIED":
        return { bg: "#e0e7ff", color: "#3730a3", border: "#c7d2fe", label: "Qualified" };
      case "PROPOSAL_SENT":
        return { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe", label: "Proposal / Demo Sent" };
      case "SUSPENDED_EFFORT":
        return { bg: "#fef3c7", color: "#92400e", border: "#fde68a", label: "Suspended" };
      case "CONTRACT_SIGNED":
        return { bg: "#dcfce7", color: "#166534", border: "#bbf7d0", label: "Contract Signed" };
      case "INVOICED":
        return { bg: "#f3e8ff", color: "#6b21a8", border: "#e9d5ff", label: "Invoiced" };
      case "PARTIAL_COLLECTED":
        return { bg: "#ccfbf1", color: "#0f766e", border: "#99f6e4", label: "Partial Collection" };
      case "FULLY_COLLECTED":
        return { bg: "#10b981", color: "#ffffff", border: "#059669", label: "Fully Collected" };
      case "ABORTED":
        return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", label: "Aborted" };
      default:
        return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: status };
    }
  }

  return (
    <div>
      {/* ACTION BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 260, maxWidth: 460, position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prospects by company name, deal code, email..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1.5px solid #cbd5e1",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        {!isRetracted && !isSuspended && (
          <button
            className="button primary"
            onClick={() => setIsRegisterModalOpen(true)}
            style={{
              background: "#0f766e",
              borderColor: "#0d655e",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
            }}
          >
            <span>➕</span> Name & Register New Prospect
          </button>
        )}
      </div>

      {/* PROSPECTS LIST CARDS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const badge = getStageBadge(item.status, item.is_force_closed, item.appeal_status);
            const isClosed = item.status === "ABORTED" || item.is_force_closed === 1;

            return (
              <div
                key={item.id}
                className="admin-card"
                style={{
                  padding: "18px 22px",
                  borderRadius: 12,
                  border: item.is_overdue && !isClosed ? "2px solid #f87171" : "1.5px solid #e2e8f0",
                  background: item.is_force_closed ? "#fffafa" : "#ffffff",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.6fr 1.4fr auto", gap: 16, alignItems: "center" }}>
                  {/* COMPANY & STAGE */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#2563eb" }}>{item.deal_code}</span>
                      <span
                        className="badge"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.label}
                      </span>
                      {item.is_test === 1 && (
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
                      {item.pending_steps_count > 0 && (
                        <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, fontWeight: 700 }}>
                          ⏳ {item.pending_steps_count} Update Awaiting Review
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 17, margin: "2px 0 2px", color: "#0f172a" }}>
                      {item.customer_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                      {item.customer_email} {item.customer_phone ? `· ${item.customer_phone}` : ""}
                    </p>
                  </div>

                  {/* PACKAGE & VALUE */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Package & Est. Contract Value</small>
                    <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 15, color: "#0f766e" }}>
                      RM {Number(item.contract_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </p>
                    <small style={{ color: "#475569" }}>{item.package_name} ({item.package_count} unit)</small>
                  </div>

                  {/* CLOSURE DEADLINE PROGRESS */}
                  <div>
                    <small style={{ color: "#64748b", fontSize: 11 }}>Closure Period Policy ({item.total_days_allowed}d)</small>
                    {item.is_force_closed ? (
                      <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 13, color: "#991b1b" }}>
                        🛑 Closed on {item.force_closed_at ? new Date(item.force_closed_at).toLocaleDateString("en-MY") : ""}
                      </p>
                    ) : item.is_overdue ? (
                      <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 13, color: "#dc2626" }}>
                        ⚠️ Overdue by {Math.abs(item.days_remaining)} days
                      </p>
                    ) : (
                      <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 13, color: "#166534" }}>
                        ⏳ {item.days_remaining} days remaining (Due {item.deadline_date_str})
                      </p>
                    )}
                    {item.extension_days_granted > 0 && (
                      <small style={{ color: "#1d4ed8", fontWeight: 600, display: "block" }}>
                        +{item.extension_days_granted}d Extension Granted
                      </small>
                    )}
                  </div>

                  {/* ACTION BUTTON */}
                  <div>
                    <Link
                      href={`/portal/prospects/${item.id}`}
                      className="button primary"
                      style={{
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>🗺️</span> View Sales Journey
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="admin-card empty" style={{ textAlign: "center", padding: 48, color: "#64748b" }}>
            <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>👥</span>
            <b>No prospects registered yet.</b>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>
              Click &quot;Name & Register New Prospect&quot; above to log your introduced customer companies and begin your sales funnel updates.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: NAME & REGISTER NEW PROSPECT */}
      {isRegisterModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 540, padding: 26, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#0f766e" }}>➕ Name & Register New Prospect</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              Enter full company details to lock in your prospect registration.
            </p>

            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 12, color: "#1e40af" }}>
              🛡️ <b>Anti-Poaching Protection:</b> Once registered, this prospect is exclusively assigned to your account. No other affiliate can register this company name until your case is closed or stopped.
            </div>

            <form action="/foliodesk/api/portal/prospects" method="post">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Full Company / Legal Name *</label>
                  <input
                    name="customerName"
                    required
                    placeholder="e.g. Pembinaan Mega Maju Sdn Bhd"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1.5px solid #94a3b8", fontWeight: 700 }}
                  />
                  <small style={{ color: "#64748b", marginTop: 2, display: "block" }}>
                    Must match the official registered business name for exclusivity protection.
                  </small>
                </div>

                <ValidatedContactInputs />

                <PackageSelectForm packages={packages} />

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Initial Introduction Notes / Requirements</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="e.g. Met MD at CIDB convention. Interested in digitizing progress claims and ERP for 3 building projects..."
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ background: "#fffbeb", padding: "10px 12px", borderRadius: 8, border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="isTest" name="isTest" value="1" defaultChecked={true} />
                  <label htmlFor="isTest" style={{ fontSize: 13, fontWeight: 700, color: "#92400e", cursor: "pointer" }}>
                    🧪 Mark as Tester Data (Default for testing & verification)
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setIsRegisterModalOpen(false)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#0f766e", borderColor: "#0d655e", fontWeight: 700 }}>
                  Register Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
