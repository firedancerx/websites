"use client";

import React, { useState } from "react";
import Link from "next/link";

interface ApprovalsViewProps {
  applications: DatabaseRow[];
  profileUpdates: DatabaseRow[];
  collections: DatabaseRow[];
  appeals: DatabaseRow[];
  steps: DatabaseRow[];
  totalPending: number;
}

export default function ApprovalsView({
  applications,
  profileUpdates,
  collections,
  appeals,
  steps,
  totalPending,
}: ApprovalsViewProps) {
  const [activeCategory, setActiveCategory] = useState<
    "ALL" | "APPLICATIONS" | "PROFILE_UPDATES" | "COLLECTIONS" | "APPEALS" | "STEPS"
  >("ALL");

  const [previewItem, setPreviewItem] = useState<{
    type: "APPLICATION" | "PROFILE_UPDATE" | "COLLECTION" | "APPEAL" | "STEP";
    data: DatabaseRow;
  } | null>(null);

  const [rejectItem, setRejectItem] = useState<{
    type: "APPLICATION" | "PROFILE_UPDATE" | "COLLECTION" | "APPEAL" | "STEP";
    data: DatabaseRow;
  } | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. SUMMARY STATS GRID */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <div
          onClick={() => setActiveCategory("ALL")}
          style={{
            background: activeCategory === "ALL" ? "#0f766e" : "#f8fafc",
            color: activeCategory === "ALL" ? "#ffffff" : "#0f172a",
            padding: 16,
            borderRadius: 12,
            border: "1.5px solid #cbd5e1",
            cursor: "pointer",
          }}
        >
          <small style={{ color: activeCategory === "ALL" ? "#ccfbf1" : "#475569", fontWeight: 700 }}>Total Pending Queue</small>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{totalPending} Items</div>
        </div>

        <div
          onClick={() => setActiveCategory("APPLICATIONS")}
          style={{
            background: activeCategory === "APPLICATIONS" ? "#0f766e" : "#f0fdf4",
            color: activeCategory === "APPLICATIONS" ? "#ffffff" : "#166534",
            padding: 16,
            borderRadius: 12,
            border: "1.5px solid #bbf7d0",
            cursor: "pointer",
          }}
        >
          <small style={{ color: activeCategory === "APPLICATIONS" ? "#ccfbf1" : "#166534", fontWeight: 700 }}>🌿 Applications</small>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{applications.length} Pending</div>
        </div>

        <div
          onClick={() => setActiveCategory("PROFILE_UPDATES")}
          style={{
            background: activeCategory === "PROFILE_UPDATES" ? "#0f766e" : "#eff6ff",
            color: activeCategory === "PROFILE_UPDATES" ? "#ffffff" : "#1e40af",
            padding: 16,
            borderRadius: 12,
            border: "1.5px solid #bfdbfe",
            cursor: "pointer",
          }}
        >
          <small style={{ color: activeCategory === "PROFILE_UPDATES" ? "#ccfbf1" : "#1e40af", fontWeight: 700 }}>📝 Profile Updates</small>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{profileUpdates.length} Pending</div>
        </div>

        <div
          onClick={() => setActiveCategory("COLLECTIONS")}
          style={{
            background: activeCategory === "COLLECTIONS" ? "#0f766e" : "#fef3c7",
            color: activeCategory === "COLLECTIONS" ? "#ffffff" : "#92400e",
            padding: 16,
            borderRadius: 12,
            border: "1.5px solid #fde68a",
            cursor: "pointer",
          }}
        >
          <small style={{ color: activeCategory === "COLLECTIONS" ? "#ccfbf1" : "#92400e", fontWeight: 700 }}>💰 Payment Collections</small>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{collections.length} Pending</div>
        </div>

        <div
          onClick={() => setActiveCategory("APPEALS")}
          style={{
            background: activeCategory === "APPEALS" ? "#0f766e" : "#fff1f2",
            color: activeCategory === "APPEALS" ? "#ffffff" : "#9f1239",
            padding: 16,
            borderRadius: 12,
            border: "1.5px solid #fecdd3",
            cursor: "pointer",
          }}
        >
          <small style={{ color: activeCategory === "APPEALS" ? "#ccfbf1" : "#9f1239", fontWeight: 700 }}>⚖️ Deadline Appeals</small>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{appeals.length} Pending</div>
        </div>

        <div
          onClick={() => setActiveCategory("STEPS")}
          style={{
            background: activeCategory === "STEPS" ? "#0f766e" : "#f3e8ff",
            color: activeCategory === "STEPS" ? "#ffffff" : "#6b21a8",
            padding: 16,
            borderRadius: 12,
            border: "1.5px solid #d8b4fe",
            cursor: "pointer",
          }}
        >
          <small style={{ color: activeCategory === "STEPS" ? "#ccfbf1" : "#6b21a8", fontWeight: 700 }}>📋 Funnel Steps</small>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{steps.length} Pending</div>
        </div>
      </div>

      {/* 2. PENDING QUEUE LIST */}
      {totalPending === 0 ? (
        <div className="admin-card empty" style={{ textAlign: "center", padding: 50, color: "#64748b", background: "#ffffff", borderRadius: 12, border: "1.5px solid #cbd5e1" }}>
          <span style={{ fontSize: 36, display: "block", marginBottom: 10 }}>🎉</span>
          <h3 style={{ margin: 0, color: "#0f172a" }}>All Clear! No Pending Items in Inbox</h3>
          <p style={{ margin: "4px 0 0", fontSize: 14 }}>
            There are currently no affiliate applications, profile updates, collections, or appeals awaiting Superadmin review.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* CATEGORY 1: AFFILIATE APPLICATIONS */}
          {(activeCategory === "ALL" || activeCategory === "APPLICATIONS") &&
            applications.map((app) => (
              <div
                key={`app-${app.id}`}
                className="admin-card"
                style={{
                  padding: "20px 24px",
                  borderRadius: 12,
                  border: "1.5px solid #bbf7d0",
                  background: "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="badge" style={{ background: "#166534", color: "#ffffff", fontWeight: 800, fontSize: 11 }}>
                        🌿 AFFILIATE APPLICATION
                      </span>
                      {app.is_test === 1 && (
                        <span style={{ fontSize: 10, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          🧪 TEST
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        Submitted {new Date(app.submitted_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 4px", fontSize: 18, color: "#0f172a" }}>
                      {app.legal_name} ({app.applicant_type})
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                      SSM/Registration #: <b>{app.company_number || "N/A"}</b> · Email: {app.email || app.user_email} · Tel: {app.phone || "N/A"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setPreviewItem({ type: "APPLICATION", data: app })}
                      style={{ background: "#ffffff", color: "#0f766e", border: "1px solid #0f766e", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      🔍 Preview Details
                    </button>

                    <form action={`/foliodesk/api/admin/applications/${app.id}`} method="post" style={{ display: "inline" }}>
                      <input type="hidden" name="decision" value="APPROVED" />
                      <button type="submit" className="button primary" style={{ background: "#166534", borderColor: "#14532d", fontWeight: 700 }}>
                        ✓ Approve Application
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => setRejectItem({ type: "APPLICATION", data: app })}
                      style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      ❌ Reject / Action
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* CATEGORY 2: PROFILE UPDATES */}
          {(activeCategory === "ALL" || activeCategory === "PROFILE_UPDATES") &&
            profileUpdates.map((pu) => (
              <div
                key={`pu-${pu.id}`}
                className="admin-card"
                style={{
                  padding: "20px 24px",
                  borderRadius: 12,
                  border: "1.5px solid #bfdbfe",
                  background: "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="badge" style={{ background: "#1e40af", color: "#ffffff", fontWeight: 800, fontSize: 11 }}>
                        📝 PROFILE & eKYC UPDATE REQUEST
                      </span>
                      {(pu.is_test === 1 || pu.isTest === 1) && (
                        <span style={{ fontSize: 10, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          🧪 TEST
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        Submitted {new Date(pu.created_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 4px", fontSize: 18, color: "#0f172a" }}>
                      {pu.legal_name} (Code: {pu.affiliate_code})
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                      Proposed Name/Entity Change from <b>{pu.current_legal_name}</b> · Bank/Address Modifications
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setPreviewItem({ type: "PROFILE_UPDATE", data: pu })}
                      style={{ background: "#ffffff", color: "#1e40af", border: "1px solid #1e40af", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      🔍 Preview Comparison
                    </button>

                    <form action={`/foliodesk/api/admin/profile-updates/${pu.id}`} method="post" style={{ display: "inline" }}>
                      <input type="hidden" name="action" value="APPROVE" />
                      <button type="submit" className="button primary" style={{ background: "#1e40af", borderColor: "#1e3a8a", fontWeight: 700 }}>
                        ✓ Approve Profile Update
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => setRejectItem({ type: "PROFILE_UPDATE", data: pu })}
                      style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      ❌ Reject Update
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* CATEGORY 3: PAYMENT COLLECTIONS */}
          {(activeCategory === "ALL" || activeCategory === "COLLECTIONS") &&
            collections.map((col) => (
              <div
                key={`col-${col.id}`}
                className="admin-card"
                style={{
                  padding: "20px 24px",
                  borderRadius: 12,
                  border: "1.5px solid #fde68a",
                  background: "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="badge" style={{ background: "#92400e", color: "#ffffff", fontWeight: 800, fontSize: 11 }}>
                        💰 PAYMENT COLLECTION APPROVAL
                      </span>
                      {(col.is_test === 1 || col.isTest === 1) && (
                        <span style={{ fontSize: 10, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          🧪 TEST
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        Submitted {new Date(col.created_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 4px", fontSize: 18, color: "#0f172a" }}>
                      RM {Number(col.collected_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })} for Invoice #{col.invoice_number || `INV-${col.deal_id}`}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                      Customer: <b>{col.customer_name}</b> ({col.deal_code}) · Partner: <b>{col.affiliate_legal_name}</b> ({col.affiliate_code}) · Tx Ref: <code>{col.bank_receipt_ref}</code>
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setPreviewItem({ type: "COLLECTION", data: col })}
                      style={{ background: "#ffffff", color: "#92400e", border: "1px solid #92400e", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      🔍 Preview Receipt & Proof
                    </button>

                    <form action={`/foliodesk/api/admin/collections/${col.id}/approve`} method="post" style={{ display: "inline" }}>
                      <button type="submit" className="button primary" style={{ background: "#0f766e", borderColor: "#0d655e", fontWeight: 700 }}>
                        ✓ Approve Collection & Lock Rates
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => setRejectItem({ type: "COLLECTION", data: col })}
                      style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      ❌ Reject Collection
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* CATEGORY 4: CLOSURE DEADLINE APPEALS */}
          {(activeCategory === "ALL" || activeCategory === "APPEALS") &&
            appeals.map((app) => (
              <div
                key={`appeal-${app.id}`}
                className="admin-card"
                style={{
                  padding: "20px 24px",
                  borderRadius: 12,
                  border: "1.5px solid #fecdd3",
                  background: "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="badge" style={{ background: "#9f1239", color: "#ffffff", fontWeight: 800, fontSize: 11 }}>
                        ⚖️ EXTENSION APPEAL SUBMISSION
                      </span>
                      {(app.is_test === 1 || app.isTest === 1) && (
                        <span style={{ fontSize: 10, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          🧪 TEST
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        Submitted {new Date(app.appeal_submitted_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 4px", fontSize: 18, color: "#0f172a" }}>
                      Deal {app.deal_code} - {app.customer_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                      Introducing Partner: <b>{app.affiliate_legal_name}</b> ({app.affiliate_code}) · Contract Value: RM {Number(app.contract_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </p>
                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: 10, borderRadius: 6, marginTop: 8, fontSize: 12, color: "#881337" }}>
                      <b>Affiliate Justification:</b> {app.appeal_reason}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Link
                      href={`/admin/deals/${app.id}`}
                      className="button secondary"
                      style={{ color: "#9f1239", borderColor: "#fecdd3", fontWeight: 700 }}
                    >
                      ⚖️ Adjudicate Appeal
                    </Link>
                  </div>
                </div>
              </div>
            ))}

          {/* CATEGORY 5: FUNNEL STEPS REVIEW */}
          {(activeCategory === "ALL" || activeCategory === "STEPS") &&
            steps.map((st) => (
              <div
                key={`step-${st.id}`}
                className="admin-card"
                style={{
                  padding: "20px 24px",
                  borderRadius: 12,
                  border: "1.5px solid #d8b4fe",
                  background: "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="badge" style={{ background: "#6b21a8", color: "#ffffff", fontWeight: 800, fontSize: 11 }}>
                        📋 FUNNEL MILESTONE REVIEW
                      </span>
                      {(st.is_test === 1 || st.isTest === 1) && (
                        <span style={{ fontSize: 10, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          🧪 TEST
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        Submitted {new Date(st.updated_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 4px", fontSize: 18, color: "#0f172a" }}>
                      Step #{st.step_number}: {st.step_title} (Deal {st.deal_code})
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                      Customer: <b>{st.customer_name}</b> · Partner: <b>{st.affiliate_legal_name}</b> ({st.affiliate_code})
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Link
                      href={`/admin/deals/${st.deal_id}`}
                      className="button secondary"
                      style={{ color: "#6b21a8", borderColor: "#d8b4fe", fontWeight: 700 }}
                    >
                      📋 Review Milestone Step
                    </Link>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* MODAL 1: ITEM PREVIEW MODAL */}
      {previewItem && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 640, padding: 26, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1.5px solid #e2e8f0", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>
                🔍 Detailed Preview & Verification
              </h3>
              <button type="button" onClick={() => setPreviewItem(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            {previewItem.type === "APPLICATION" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div><strong>Legal Name:</strong> {previewItem.data.legal_name}</div>
                <div><strong>Applicant Type:</strong> {previewItem.data.applicant_type}</div>
                <div><strong>Registration / NRIC #:</strong> {previewItem.data.company_number || "N/A"}</div>
                <div><strong>Email:</strong> {previewItem.data.email || previewItem.data.user_email}</div>
                <div><strong>Phone:</strong> {previewItem.data.phone || "N/A"}</div>
                <div><strong>Country & State:</strong> {previewItem.data.country_code} · {previewItem.data.state}</div>
                <div><strong>Address:</strong> {previewItem.data.address_line1} {previewItem.data.address_line2} {previewItem.data.town} {previewItem.data.postcode}</div>
                <div><strong>Market Focus:</strong> {previewItem.data.market_focus || "N/A"}</div>
                <div><strong>Audience Description:</strong> {previewItem.data.audience_description || "N/A"}</div>
                {previewItem.data.id_doc_path && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Identity Document / SSM Proof:</strong><br />
                    <a href={`/foliodesk${previewItem.data.id_doc_path}`} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: 700 }}>
                      📄 View Uploaded Document File
                    </a>
                  </div>
                )}
              </div>
            )}

            {previewItem.type === "PROFILE_UPDATE" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div><strong>Affiliate Code:</strong> {previewItem.data.affiliate_code}</div>
                <div><strong>Current Legal Name:</strong> {previewItem.data.current_legal_name}</div>
                <div><strong>Requested Legal Name:</strong> <b style={{ color: "#1e40af" }}>{previewItem.data.legal_name}</b></div>
                <div><strong>Requested SSM/NRIC #:</strong> {previewItem.data.company_number}</div>
                <div><strong>Requested Bank/Currency:</strong> {previewItem.data.currency}</div>
                <div><strong>Requested Address:</strong> {previewItem.data.address_line1} {previewItem.data.town} {previewItem.data.state}</div>
                {previewItem.data.id_doc_path && (
                  <div style={{ marginTop: 8 }}>
                    <strong>New Document Attachment:</strong><br />
                    <a href={`/foliodesk${previewItem.data.id_doc_path}`} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: 700 }}>
                      📄 View New Document File
                    </a>
                  </div>
                )}
              </div>
            )}

            {previewItem.type === "COLLECTION" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div><strong>Deal Reference:</strong> {previewItem.data.deal_code}</div>
                <div><strong>Customer Name:</strong> {previewItem.data.customer_name}</div>
                <div><strong>Introducing Partner:</strong> {previewItem.data.affiliate_legal_name} ({previewItem.data.affiliate_code})</div>
                <div><strong>Invoice #:</strong> {previewItem.data.invoice_number}</div>
                <div><strong>Contract Value:</strong> RM {Number(previewItem.data.contract_value_myr).toFixed(2)}</div>
                <div><strong>Collected Amount:</strong> <b style={{ color: "#166534", fontSize: 15 }}>RM {Number(previewItem.data.collected_amount_myr).toFixed(2)}</b></div>
                <div><strong>Collection Date:</strong> {previewItem.data.collection_date ? new Date(previewItem.data.collection_date).toLocaleDateString("en-MY") : "N/A"}</div>
                <div><strong>Bank Receipt / Tx Reference:</strong> <code>{previewItem.data.bank_receipt_ref}</code></div>
                {previewItem.data.proof_media_path && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Bank Deposit Proof File:</strong><br />
                    <a href={`/foliodesk${previewItem.data.proof_media_path}`} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: 700 }}>
                      📄 View Uploaded Payment Receipt
                    </a>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
              <button type="button" className="button secondary" onClick={() => setPreviewItem(null)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT / ACTION DIALOG */}
      {rejectItem && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 520, padding: 26, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#991b1b" }}>
              ❌ Reject / Return Submission
            </h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              Specify adjudication remarks for this rejection or correction request.
            </p>

            {rejectItem.type === "APPLICATION" && (
              <form action={`/foliodesk/api/admin/applications/${rejectItem.data.id}`} method="post">
                <input type="hidden" name="decision" value="REJECTED" />
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Rejection Remarks *</label>
                    <textarea name="remarks" required rows={3} placeholder="Provide clear reasons for non-approval..." style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                  <button type="button" className="button secondary" onClick={() => setRejectItem(null)}>Cancel</button>
                  <button type="submit" className="button primary" style={{ background: "#991b1b", borderColor: "#7f1d1d", fontWeight: 700 }}>Confirm Rejection</button>
                </div>
              </form>
            )}

            {rejectItem.type === "PROFILE_UPDATE" && (
              <form action={`/foliodesk/api/admin/profile-updates/${rejectItem.data.id}`} method="post">
                <input type="hidden" name="action" value="REJECT" />
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Rejection Remarks *</label>
                    <textarea name="adminRemarks" required rows={3} placeholder="Explain why profile changes cannot be approved..." style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                  <button type="button" className="button secondary" onClick={() => setRejectItem(null)}>Cancel</button>
                  <button type="submit" className="button primary" style={{ background: "#991b1b", borderColor: "#7f1d1d", fontWeight: 700 }}>Confirm Rejection</button>
                </div>
              </form>
            )}

            {rejectItem.type === "COLLECTION" && (
              <form action={`/foliodesk/api/admin/collections/${rejectItem.data.id}/reject`} method="post">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Rejection Reason / Note *</label>
                    <textarea name="reason" required rows={3} placeholder="e.g. Unverified bank transfer reference or missing receipt proof..." style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                  <button type="button" className="button secondary" onClick={() => setRejectItem(null)}>Cancel</button>
                  <button type="submit" className="button primary" style={{ background: "#991b1b", borderColor: "#7f1d1d", fontWeight: 700 }}>Confirm Rejection</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
