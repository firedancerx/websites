"use client";

import { useState } from "react";
import Link from "next/link";
import type { DealRecord, FunnelStepRecord, ClosureLogRecord, CollectionRecord, FunnelStatus, StepReviewStatus } from "../../../../lib/funnel";
import ToggleTestModeButton from "../../ToggleTestModeButton";
import InvoiceDocumentModal from "../../../components/InvoiceDocumentModal";

export default function DealDetailView({
  deal,
  steps,
  closureLogs,
  collections,
  closurePeriodDays,
  daysRemaining,
  isOverdue,
  deadlineDateStr,
}: {
  deal: DealRecord;
  steps: FunnelStepRecord[];
  closureLogs: ClosureLogRecord[];
  collections: CollectionRecord[];
  closurePeriodDays: number;
  daysRemaining: number;
  isOverdue: boolean;
  deadlineDateStr: string;
}) {
  const [returnTargetStep, setReturnTargetStep] = useState<FunnelStepRecord | null>(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isForceCloseModalOpen, setIsForceCloseModalOpen] = useState(false);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isInvoiceDocOpen, setIsInvoiceDocOpen] = useState(false);

  // T-406 (plan §7.5, F-11): double-submit guard for the appeal-recommendation
  // form, matching the pattern already applied to Collections and Payouts.
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  const isInvoiceIssued = Boolean(deal.invoice_number);
  const invoiceTarget = deal.invoice_target || "PROSPECT";
  const totalApprovedCollected = Number(deal.total_collected_myr || 0);
  const contractVal = Number(deal.contract_value_myr || 0);
  const isFullyCollected = deal.status === "FULLY_COLLECTED" || (contractVal > 0 && totalApprovedCollected >= contractVal);
  const isFullyFinalized = isFullyCollected || (deal.status as string) === "CLIENT_ONBOARDED" || (deal.status as string) === "CLOSED_WON";
  const isClosed = deal.status === "ABORTED" || deal.is_force_closed === 1 || isFullyFinalized;
  const hasAppeal = deal.appeal_status === "APPEAL_SUBMITTED";
  // T-406 (plan §7.5): mirrors the mc_request_status badge/hide-button treatment
  // already given to Collections and Payouts -- once the Admin has submitted an
  // appeal recommendation, it must not be resubmittable until Management decides.
  const isAwaitingMgtReview = deal.mc_request_status === "PENDING";

  function getStepBadge(status: StepReviewStatus) {
    switch (status) {
      case "ACKNOWLEDGED":
        return { bg: "#dcfce7", color: "#166534", border: "#bbf7d0", label: "✓ Acknowledged" };
      case "RETURNED_FOR_REVIEW":
        return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", label: "↩️ Returned for Review" };
      case "PENDING_REVIEW":
      default:
        return { bg: "#fef3c7", color: "#92400e", border: "#fde68a", label: "⏳ Awaiting Review" };
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. TOP HEADER SUMMARY */}
      <div
        className="admin-card"
        style={{
          padding: "24px 28px",
          borderRadius: 14,
          border: deal.is_force_closed ? "2px solid #f87171" : isOverdue ? "2px solid #fbbf24" : "1.5px solid #cbd5e1",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#2563eb" }}>{deal.deal_code}</span>
              <span className="badge" style={{ background: "#0f766e", color: "#fff", fontWeight: 700, fontSize: 11 }}>
                Approved Stage: {deal.status.replaceAll("_", " ")}
              </span>
              {deal.is_test === 1 && (
                <span className="badge" style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", fontWeight: 700, fontSize: 11 }}>
                  🧪 TESTER DATA
                </span>
              )}
              {hasAppeal && isAwaitingMgtReview && (
                <span className="badge" style={{ background: "#ede9fe", color: "#5b21b6", border: "1px solid #ddd6fe", fontWeight: 700, fontSize: 11 }}>
                  🔎 PENDING MANAGEMENT REVIEW
                </span>
              )}
              {hasAppeal && !isAwaitingMgtReview && (
                <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: 11 }}>
                  ⚖️ Extension Appeal Pending
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 24, margin: "2px 0 4px", color: "#0f172a" }}>
              {deal.customer_name}
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
              Introducing Affiliate: <b>{deal.affiliate_legal_name}</b> ({deal.affiliate_code}) · {deal.affiliate_email}
            </p>
          </div>

          {/* ADMIN MANAGEMENT ACTION BUTTONS */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <ToggleTestModeButton entityType="deal" entityId={deal.id} isTest={deal.is_test} size="md" />
            {hasAppeal && !isAwaitingMgtReview && (
              <button
                className="button primary"
                onClick={() => setIsAppealModalOpen(true)}
                style={{ background: "#b45309", borderColor: "#92400e", fontWeight: 700 }}
              >
                ⚖️ Review Affiliate Appeal
              </button>
            )}
            {hasAppeal && isAwaitingMgtReview && (
              <span
                className="badge"
                style={{ background: "#ede9fe", color: "#5b21b6", border: "1px solid #ddd6fe", fontWeight: 700, fontSize: 12, padding: "8px 12px" }}
              >
                Awaiting Management decision
              </span>
            )}

            {isFullyFinalized ? (
              <span
                className="badge"
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  border: "1.5px solid #bbf7d0",
                  fontWeight: 800,
                  padding: "8px 14px",
                  fontSize: 13,
                  borderRadius: 8,
                }}
              >
                ✓ Payment Fully Received & Sealed (RM {contractVal.toLocaleString("en-MY", { minimumFractionDigits: 2 })})
              </span>
            ) : (
              <>
                <button
                  className="button secondary"
                  onClick={() => setIsExtendModalOpen(true)}
                  style={{ fontWeight: 700 }}
                >
                  ⏳ Extend Closure Deadline
                </button>

                {!isClosed && (
                  <button
                    className="button secondary"
                    onClick={() => setIsForceCloseModalOpen(true)}
                    style={{ color: "#991b1b", borderColor: "#fca5a5" }}
                  >
                    🛑 Force Close Attempt
                  </button>
                )}

                {isInvoiceIssued ? (
                  <>
                    <button
                      className="button secondary"
                      onClick={() => setIsInvoiceDocOpen(true)}
                      style={{ background: "#f3e8ff", color: "#6b21a8", borderColor: "#6b21a8", fontWeight: 700 }}
                    >
                      📄 View Invoice #{deal.invoice_number}
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => setIsInvoiceModalOpen(true)}
                      style={{ background: "#faf5ff", color: "#6b21a8", borderColor: "#c084fc", fontWeight: 700 }}
                    >
                      ✏️ Re-issue / Replace Invoice
                    </button>
                  </>
                ) : (
                  <button
                    className="button secondary"
                    onClick={() => setIsInvoiceModalOpen(true)}
                    style={{ background: "#6b21a8", color: "#ffffff", borderColor: "#6b21a8", fontWeight: 700 }}
                  >
                    📄 Issue Official Invoice
                  </button>
                )}

                {isInvoiceIssued && (
                  <button
                    className="button primary"
                    onClick={() => setIsCollectionModalOpen(true)}
                    style={{ background: "#0f766e", borderColor: "#0d655e", fontWeight: 700 }}
                  >
                    💰 Record Collection
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* METRICS & CLOSURE DEADLINE GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 20, paddingTop: 18, borderTop: "1px solid #f1f5f9" }}>
          <div>
            <small style={{ color: "#64748b", fontSize: 11 }}>Contract Value</small>
            <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 16, color: "#0f172a" }}>
              RM {Number(deal.contract_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
            </p>
            <small style={{ color: "#475569", fontWeight: 600 }}>
              {deal.package_name} ({deal.package_count} {deal.package_name.includes("5-User") ? (Number(deal.package_count) > 1 ? `Blocks · ${Number(deal.package_count) * 5} Seats` : "Block · 5 Seats") : (Number(deal.package_count) > 1 ? "Units" : "Unit")})
            </small>
          </div>

          <div>
            <small style={{ color: "#64748b", fontSize: 11 }}>Total Approved Collections</small>
            <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 16, color: Number(deal.total_collected_myr) > 0 ? "#15803d" : "#64748b" }}>
              RM {Number(deal.total_collected_myr || 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <small style={{ color: "#64748b", fontSize: 11 }}>Initial Log Date</small>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#334155" }}>
              {new Date(deal.created_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
            </p>
          </div>

          <div>
            <small style={{ color: "#64748b", fontSize: 11 }}>Closure Period Status</small>
            {deal.is_force_closed ? (
              <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 13, color: "#991b1b" }}>
                🛑 Closed on {deal.force_closed_at ? new Date(deal.force_closed_at).toLocaleDateString("en-MY") : ""}
              </p>
            ) : isOverdue ? (
              <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 13, color: "#dc2626" }}>
                ⚠️ Overdue by {Math.abs(daysRemaining)} days
              </p>
            ) : (
              <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 13, color: "#166534" }}>
                ⏳ {daysRemaining} days left (Due {deadlineDateStr})
              </p>
            )}
            {deal.extension_days_granted > 0 && (
              <small style={{ color: "#1d4ed8", fontWeight: 600, display: "block" }}>
                +{deal.extension_days_granted}d Extension Granted
              </small>
            )}
          </div>
        </div>

        {/* INVOICING TARGET & BILLING ENTITY SWITCH CARD */}
        <div
          style={{
            background: invoiceTarget === "AFFILIATE" ? "#f5f3ff" : "#f0fdf4",
            border: invoiceTarget === "AFFILIATE" ? "1.5px solid #ddd6fe" : "1.5px solid #bbf7d0",
            borderRadius: 10,
            padding: "16px 20px",
            marginTop: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <small style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
              Invoicing Target & Recipient Configuration
            </small>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: invoiceTarget === "AFFILIATE" ? "#6b21a8" : "#166534",
                }}
              >
                {invoiceTarget === "AFFILIATE" ? "🤝 Invoicing Billed to Introducing Affiliate" : "🏢 Invoicing Billed to Customer / Prospect"}
              </span>
              <span
                className="badge"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: invoiceTarget === "AFFILIATE" ? "#e9d5ff" : "#dcfce7",
                  color: invoiceTarget === "AFFILIATE" ? "#581c87" : "#14532d",
                }}
              >
                Target: {invoiceTarget}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#475569" }}>
              <b>Billed Recipient:</b> {invoiceTarget === "AFFILIATE" ? `${deal.affiliate_legal_name} (${deal.affiliate_code})` : `${deal.customer_name} (${deal.customer_email})`}
            </p>
          </div>

          <form action="/foliodesk/api/admin/deals" method="POST" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="hidden" name="action" value="TOGGLE_INVOICE_TARGET" />
            <input type="hidden" name="dealId" value={deal.id} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Switch Invoicing Target:</span>
            <button
              type="submit"
              name="invoiceTarget"
              value="PROSPECT"
              disabled={invoiceTarget === "PROSPECT"}
              className="button secondary"
              style={{
                fontSize: 12,
                padding: "6px 12px",
                background: invoiceTarget === "PROSPECT" ? "#166534" : "#ffffff",
                color: invoiceTarget === "PROSPECT" ? "#ffffff" : "#334155",
                borderColor: invoiceTarget === "PROSPECT" ? "#166534" : "#cbd5e1",
                fontWeight: 700,
                opacity: invoiceTarget === "PROSPECT" ? 0.7 : 1,
              }}
            >
              🏢 Bill Prospect
            </button>
            <button
              type="submit"
              name="invoiceTarget"
              value="AFFILIATE"
              disabled={invoiceTarget === "AFFILIATE"}
              className="button secondary"
              style={{
                fontSize: 12,
                padding: "6px 12px",
                background: invoiceTarget === "AFFILIATE" ? "#6b21a8" : "#ffffff",
                color: invoiceTarget === "AFFILIATE" ? "#ffffff" : "#334155",
                borderColor: invoiceTarget === "AFFILIATE" ? "#6b21a8" : "#cbd5e1",
                fontWeight: 700,
                opacity: invoiceTarget === "AFFILIATE" ? 0.7 : 1,
              }}
            >
              🤝 Bill Affiliate
            </button>
          </form>
        </div>
      </div>

      {/* 2. CHRONOLOGICAL SALES FUNNEL STEPS & ADMIN REVIEW ACTIONS */}
      <div className="admin-card" style={{ padding: "24px 28px", borderRadius: 12 }}>
        <h3 style={{ fontSize: 18, margin: "0 0 4px", color: "#0f172a" }}>
          📜 Sales Funnel Step History & Administrative Review Cycles
        </h3>
        <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: 13 }}>
          Review progress updates submitted by the affiliate. Acknowledge stage updates or return them with corrective remarks.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {steps.length > 0 ? (
            steps.map((step, idx) => {
              const reviewBadge = getStepBadge(step.admin_review_status);
              const isPending = step.admin_review_status === "PENDING_REVIEW";
              const isReturned = step.admin_review_status === "RETURNED_FOR_REVIEW";

              return (
                <div
                  key={step.id}
                  style={{
                    padding: 18,
                    borderRadius: 10,
                    border: isPending ? "2px solid #fde68a" : isReturned ? "2px solid #fca5a5" : "1px solid #e2e8f0",
                    background: isPending ? "#fffef9" : isReturned ? "#fffafa" : "#f8fafc",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#0f766e" }}>STEP #{steps.length - idx}</span>
                        <span className="badge" style={{ background: reviewBadge.bg, color: reviewBadge.color, border: `1px solid ${reviewBadge.border}`, fontSize: 11, fontWeight: 700 }}>
                          {reviewBadge.label}
                        </span>
                        <span className="badge" style={{ background: "#e0e7ff", color: "#3730a3", fontSize: 11 }}>
                          Target: {step.to_stage.replaceAll("_", " ")}
                        </span>
                      </div>
                      <h4 style={{ fontSize: 16, margin: "2px 0 0", color: "#0f172a" }}>{step.step_title}</h4>
                    </div>

                    <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
                      <b>Submitted:</b> {new Date(step.submitted_at).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>

                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#334155", background: "#ffffff", padding: "10px 14px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                    <b>Affiliate Notes:</b> {step.affiliate_notes}
                  </p>

                  {step.admin_remarks && (
                    <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 6, background: isReturned ? "#fee2e2" : "#f0fdf4", border: isReturned ? "1px solid #fecaca" : "1px solid #bbf7d0", fontSize: 13 }}>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, color: isReturned ? "#991b1b" : "#166534" }}>
                        {isReturned ? "↩️ Admin Review Remarks:" : "✓ Admin Acknowledgement Note:"}
                      </p>
                      <p style={{ margin: 0, color: isReturned ? "#7f1d1d" : "#14532d" }}>{step.admin_remarks}</p>
                      {step.reviewed_at && (
                        <small style={{ color: "#64748b", marginTop: 4, display: "block" }}>
                          Reviewed by {step.reviewer_name || "Admin"} on {new Date(step.reviewed_at).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
                        </small>
                      )}
                    </div>
                  )}

                  {/* ADMIN ACTION CONTROLS ON PENDING STEPS */}
                  {isPending && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #e2e8f0", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="button secondary"
                        style={{ color: "#991b1b", borderColor: "#fca5a5", fontSize: 12, padding: "6px 12px" }}
                        onClick={() => setReturnTargetStep(step)}
                      >
                        ↩️ Return for Review (with Remarks)
                      </button>

                      <form action={`/foliodesk/api/admin/deals/${deal.id}/step-review`} method="post" style={{ display: "inline" }}>
                        <input type="hidden" name="stepId" value={step.id} />
                        <input type="hidden" name="action" value="ACKNOWLEDGE" />
                        <button
                          type="submit"
                          className="button primary"
                          style={{ background: "#0f766e", borderColor: "#0d655e", fontSize: 12, padding: "6px 14px", fontWeight: 700 }}
                        >
                          ✓ Acknowledge Stage Update
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: 30, color: "#64748b" }}>
              No funnel updates logged yet.
            </div>
          )}
        </div>
      </div>

      {/* 3. RECORDED INVOICE COLLECTIONS & MANAGEMENT APPROVALS */}
      <div className="admin-card" style={{ padding: "24px 28px", borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, margin: 0, color: "#0f172a" }}>💰 Invoice Collections & Payment Advices</h3>
            <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 13 }}>
              Collections recorded against this customer contract.
            </p>
          </div>
          {isInvoiceIssued && (
            <button
              className="button primary"
              onClick={() => setIsCollectionModalOpen(true)}
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              ➕ Record New Collection
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {collections.length > 0 ? (
            collections.map((coll) => (
              <div key={coll.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div>
                  <b style={{ color: "#0f766e" }}>Inv #{coll.invoice_number}</b> · Bank Ref: {coll.bank_receipt_ref}
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                    Collected: RM {Number(coll.collected_amount_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })} on {new Date(coll.collection_date).toLocaleDateString("en-MY")}
                  </p>
                </div>
                <div>
                  <span className="badge" style={{ background: coll.approval_status === "APPROVED" ? "#dcfce7" : "#fef3c7", color: coll.approval_status === "APPROVED" ? "#166534" : "#92400e" }}>
                    {coll.approval_status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
              No collections recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* 4. CLOSURE & EXTENSION LOGS */}
      {closureLogs.length > 0 && (
        <div className="admin-card" style={{ padding: "20px 24px", borderRadius: 12 }}>
          <h3 style={{ fontSize: 16, margin: "0 0 12px", color: "#0f172a" }}>⏳ Closure & Extension Audit Logs</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {closureLogs.map((log) => (
              <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 6, fontSize: 13 }}>
                <div>
                  <b style={{ color: "#0f766e" }}>{log.action_type.replaceAll("_", " ")}:</b> {log.action_notes}
                  {log.days_extended > 0 && <span style={{ color: "#1d4ed8", fontWeight: 700 }}> (+{log.days_extended} days)</span>}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  By {log.performer_name || "Admin"} on {new Date(log.created_at).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: RETURN STEP FOR REVIEW (WITH REMARKS) */}
      {returnTargetStep && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 520, padding: 26, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#991b1b" }}>↩️ Return Step for Review & Correction</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              Provide constructive feedback to {deal.affiliate_legal_name}.
            </p>

            <form action={`/foliodesk/api/admin/deals/${deal.id}/step-review`} method="post">
              <input type="hidden" name="stepId" value={returnTargetStep.id} />
              <input type="hidden" name="action" value="RETURN_FOR_REVIEW" />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Administrative Remarks / Required Clarifications *</label>
                  <textarea
                    name="adminRemarks"
                    required
                    rows={4}
                    placeholder="e.g. Please attach a copy of the finalized quotation submitted to the procurement committee..."
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setReturnTargetStep(null)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#b91c1c", borderColor: "#991b1b", fontWeight: 700 }}>
                  Send Remarks to Affiliate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DIRECT EXTENSION (+DAYS) */}
      {isExtendModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#0f766e" }}>⏳ Extend Closure Deadline</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              Grant additional negotiation days for {deal.customer_name}.
            </p>

            <form action={`/foliodesk/api/admin/deals/${deal.id}/closure`} method="post">
              <input type="hidden" name="action" value="EXTEND_DIRECT" />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Number of Extension Days *</label>
                  <input
                    name="daysExtended"
                    type="number"
                    min="1"
                    max="180"
                    defaultValue="30"
                    required
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #94a3b8", fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Administrative Notes / Justification</label>
                  <textarea
                    name="reason"
                    rows={2}
                    placeholder="e.g. Granted 30 days extension due to client internal budget cycle..."
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setIsExtendModalOpen(false)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#0f766e", borderColor: "#0d655e", fontWeight: 700 }}>
                  Apply Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FORCE CLOSE ATTEMPT */}
      {isForceCloseModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#991b1b" }}>🛑 Force Close Prospect Attempt</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              This will stop the active attempt. The affiliate will be notified and can appeal.
            </p>

            <form action={`/foliodesk/api/admin/deals/${deal.id}/closure`} method="post">
              <input type="hidden" name="action" value="FORCE_CLOSE" />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Reason for Forced Closure *</label>
                  <textarea
                    name="reason"
                    required
                    rows={3}
                    placeholder="e.g. Closure period expired without tender submission or active negotiation..."
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setIsForceCloseModalOpen(false)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#991b1b", borderColor: "#7f1d1d", fontWeight: 700 }}>
                  Confirm Forced Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADJUDICATE AFFILIATE APPEAL */}
      {isAppealModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 540, padding: 26, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#b45309" }}>⚖️ Review Extension Appeal</h3>
            <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>
              Submitted by <b>{deal.affiliate_legal_name}</b> on {deal.appeal_submitted_at ? new Date(deal.appeal_submitted_at).toLocaleDateString("en-MY") : ""}
            </p>
            <div style={{ background: "#ede9fe", border: "1px solid #ddd6fe", padding: 10, borderRadius: 6, marginBottom: 14, fontSize: 12, color: "#5b21b6" }}>
              🔎 Your recommendation below is submitted to a Management user for sign-off. Nothing changes on this deal until Management approves.
            </div>

            <div style={{ background: "#fef3c7", padding: 12, borderRadius: 6, border: "1px solid #fde68a", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
              <b>Affiliate Justification:</b><br />
              {deal.appeal_reason}
            </div>

            <form action={`/foliodesk/api/admin/deals/${deal.id}/closure`} method="post" onSubmit={() => setIsSubmittingAppeal(true)}>
              <input type="hidden" name="action" value="ADJUDICATE_APPEAL" />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Decision *</label>
                  <select name="isAppealApproved" defaultValue="1" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontWeight: 700 }}>
                    <option value="1">✓ Approve Appeal & Grant Extension</option>
                    <option value="0">❌ Reject Appeal (Confirm Closure)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Extension Days (if approved)</label>
                  <input
                    name="daysExtended"
                    type="number"
                    min="1"
                    max="180"
                    defaultValue="30"
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Adjudication Notes</label>
                  <textarea
                    name="reason"
                    rows={2}
                    placeholder="e.g. Approved 30 days extension based on verified client tender timeline..."
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setIsAppealModalOpen(false)} disabled={isSubmittingAppeal}>Cancel</button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={isSubmittingAppeal}
                  style={{ background: "#0f766e", borderColor: "#0d655e", fontWeight: 700, opacity: isSubmittingAppeal ? 0.6 : 1, cursor: isSubmittingAppeal ? "not-allowed" : "pointer" }}
                >
                  {isSubmittingAppeal ? "Submitting…" : "📤 Submit Recommendation for Management Sign-off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECORD COLLECTION */}
      {isCollectionModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 540, padding: 26, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#0f766e" }}>💰 Record Invoice Payment Collection</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              Customer: <b>{deal.customer_name}</b> · Contract: RM {Number(deal.contract_value_myr).toFixed(2)}
            </p>

            <form action={`/foliodesk/api/admin/deals/${deal.id}/collect`} method="post" encType="multipart/form-data">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Invoice Number *</label>
                    <input name="invoiceNumber" required defaultValue={deal.invoice_number || `INV-${new Date().getFullYear()}-001`} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Invoice Total (MYR) *</label>
                    <input name="invoiceTotalMyr" type="number" step="0.01" defaultValue={deal.contract_value_myr} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Collected Amount (MYR) *</label>
                    <input name="collectedAmountMyr" type="number" step="0.01" defaultValue={deal.contract_value_myr} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #0f766e", fontWeight: 800 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Collection Date *</label>
                    <input name="collectionDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Bank Receipt / Tx Reference *</label>
                  <input name="bankReceiptRef" required placeholder="e.g. MBB-9831902 / DUITNOW-8912" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Proof Media File (Optional PDF / Image)</label>
                  <input name="proofFile" type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="isFinalCollection" name="isFinalCollection" value="1" defaultChecked />
                  <label htmlFor="isFinalCollection" style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    This is the final full payment collection for this contract
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setIsCollectionModalOpen(false)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#0f766e", borderColor: "#0d655e", fontWeight: 700 }}>
                  Submit Collection for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 6: ISSUE OFFICIAL INVOICE */}
      {isInvoiceModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 540, padding: 26, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#6b21a8" }}>
              {isInvoiceIssued ? "📄 Re-issue / Replace Official Invoice" : "📄 Issue Official Invoice"}
            </h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              {isInvoiceIssued
                ? <>Re-issuing this invoice will <b>update and replace</b> the existing official invoice details for deal <b>{deal.deal_code}</b>. Existing collections remain linked with zero double counting.</>
                : <>Issue official invoice for deal <b>{deal.deal_code}</b>. Payment collections can be recorded once this official invoice is issued.</>}
            </p>

            <form action="/foliodesk/api/admin/deals" method="POST">
              <input type="hidden" name="action" value="UPDATE_STATUS" />
              <input type="hidden" name="dealId" value={deal.id} />
              <input type="hidden" name="targetStatus" value={deal.status === "LEAD_SUBMITTED" || deal.status === "QUALIFIED" || deal.status === "PROPOSAL_SENT" || deal.status === "CONTRACT_SIGNED" ? "INVOICED" : deal.status} />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Official Invoice Number *</label>
                  <input
                    name="invoiceNumber"
                    required
                    defaultValue={deal.invoice_number || `INV-${new Date().getFullYear()}-${String(deal.id).padStart(4, "0")}`}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #6b21a8", fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Invoicing Target / Billed Entity *</label>
                  <select
                    name="invoiceTarget"
                    defaultValue={invoiceTarget}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 600 }}
                  >
                    <option value="PROSPECT">🏢 Bill Prospect: {deal.customer_name} ({deal.customer_email})</option>
                    <option value="AFFILIATE">🤝 Bill Introducing Affiliate: {deal.affiliate_legal_name} ({deal.affiliate_code})</option>
                  </select>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, fontSize: 12 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "#334155" }}>Invoice Details & Billed Address:</p>
                  <p style={{ margin: "4px 0 0", color: "#475569" }}>
                    <b>Recipient:</b> {invoiceTarget === "AFFILIATE" ? `${deal.affiliate_legal_name} (Code: ${deal.affiliate_code})` : `${deal.customer_name}`}<br />
                    <b>Contact Email:</b> {invoiceTarget === "AFFILIATE" ? (deal.affiliate_email || "N/A") : deal.customer_email}<br />
                    <b>Package:</b> {deal.package_name} ({deal.package_count} units)<br />
                    <b>Total Invoice Amount:</b> <b style={{ color: "#166534", fontSize: 13 }}>RM {Number(deal.contract_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</b>
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#6b21a8", borderColor: "#581c87", fontWeight: 700 }}>
                  Issue Official Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 7: VIEW/PRINT INVOICE DOCUMENT */}
      {isInvoiceDocOpen && (
        <InvoiceDocumentModal
          deal={{
            ...deal,
            invoice_target: invoiceTarget as any,
          }}
          onClose={() => setIsInvoiceDocOpen(false)}
          onRecordCollection={() => {
            setIsInvoiceDocOpen(false);
            setIsCollectionModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
