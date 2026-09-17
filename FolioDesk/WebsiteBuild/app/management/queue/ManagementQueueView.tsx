"use client";

import { useMemo, useState } from "react";
import { CSRF_FIELD } from "../../../lib/csrf-shared";

// T-405 (plan §7.5): the unified Management inbox. Renders every PENDING
// maker_checker_requests row (across all four request types) as a card and
// lets Management approve-as-submitted or reject-with-reason via the
// matching decide endpoint built in T-401..T-404. Deliberately does not
// re-author any of the maker's proposed values (amounts, dates, days
// extended) -- Management can only Approve or Reject what was submitted,
// consistent with every decide route's "approves-as-submitted" contract.

export interface QueueItem {
  mcId: number;
  requestType:
    | "COLLECTION_APPROVAL"
    | "PAYOUT_DISBURSEMENT"
    | "APPLICATION_APPROVAL"
    | "CLOSURE_APPEAL_ADJUDICATION";
  entityType: string;
  entityId: number;
  submittedAt: string;
  submitterName: string;
  submittedById: number;
  title: string;
  subtitle: string;
  amount?: number;
  meta: { label: string; value: string }[];
  decideAction: string;
  decideField: "form" | "requestId";
}

const REQUEST_TYPE_LABEL: Record<QueueItem["requestType"], string> = {
  COLLECTION_APPROVAL: "⚖️ Collection Approval",
  PAYOUT_DISBURSEMENT: "💳 Payout Disbursement",
  APPLICATION_APPROVAL: "🌿 Application Approval",
  CLOSURE_APPEAL_ADJUDICATION: "⚖️ Force-Closure Appeal",
};

const REQUEST_TYPE_COLOR: Record<QueueItem["requestType"], { bg: string; fg: string; border: string }> = {
  COLLECTION_APPROVAL: { bg: "#ecfdf5", fg: "#065f46", border: "#a7f3d0" },
  PAYOUT_DISBURSEMENT: { bg: "#eff6ff", fg: "#1d4ed8", border: "#bfdbfe" },
  APPLICATION_APPROVAL: { bg: "#f0fdfa", fg: "#0f766e", border: "#99f6e4" },
  CLOSURE_APPEAL_ADJUDICATION: { bg: "#fdf2f8", fg: "#9d174d", border: "#fbcfe8" },
};

function formatMyr(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return "-";
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ManagementQueueView({
  items,
  currentManagementId,
  csrfToken,
}: {
  items: QueueItem[];
  currentManagementId: number;
  csrfToken: string;
}) {
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [decisionModal, setDecisionModal] = useState<{ item: QueueItem; decision: "APPROVE" | "REJECT" } | null>(
    null
  );

  const filteredItems = useMemo(() => {
    if (typeFilter === "ALL") return items;
    return items.filter((i) => i.requestType === typeFilter);
  }, [items, typeFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length };
    for (const i of items) c[i.requestType] = (c[i.requestType] || 0) + 1;
    return c;
  }, [items]);

  return (
    <>
      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {(["ALL", "COLLECTION_APPROVAL", "PAYOUT_DISBURSEMENT", "APPLICATION_APPROVAL", "CLOSURE_APPEAL_ADJUDICATION"] as const).map(
          (t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                border: typeFilter === t ? "1.5px solid #5b21b6" : "1px solid #e2e8f0",
                background: typeFilter === t ? "#f5f3ff" : "#ffffff",
                color: typeFilter === t ? "#5b21b6" : "#475569",
                fontWeight: typeFilter === t ? 700 : 500,
                fontSize: 13,
                padding: "8px 14px",
                borderRadius: 999,
                cursor: "pointer",
              }}
            >
              {t === "ALL" ? "All Requests" : REQUEST_TYPE_LABEL[t]} ({counts[t] || 0})
            </button>
          )
        )}
      </div>

      {filteredItems.length === 0 && (
        <div
          style={{
            border: "1px dashed #cbd5e1",
            borderRadius: 12,
            padding: "48px 24px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          ✅ Nothing waiting on your decision right now.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredItems.map((item) => {
          const color = REQUEST_TYPE_COLOR[item.requestType];
          const isOwnSubmission = item.submittedById === currentManagementId;

          return (
            <div
              key={item.mcId}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 18,
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 11,
                      fontWeight: 700,
                      color: color.fg,
                      background: color.bg,
                      border: `1px solid ${color.border}`,
                      borderRadius: 999,
                      padding: "3px 10px",
                      marginBottom: 8,
                    }}
                  >
                    {REQUEST_TYPE_LABEL[item.requestType]}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{item.title}</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{item.subtitle}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  {item.amount !== undefined && (
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{formatMyr(item.amount)}</div>
                  )}
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    Submitted by {item.submitterName}
                    <br />
                    {new Date(item.submittedAt).toLocaleString("en-MY")}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 8,
                  marginTop: 12,
                  padding: "12px 0",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                {item.meta.map((m) => (
                  <div key={m.label}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 13, color: "#1e293b" }}>{m.value || "-"}</div>
                  </div>
                ))}
              </div>

              {isOwnSubmission ? (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#92400e",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 8,
                    padding: "8px 12px",
                  }}
                >
                  ⚠️ You submitted this request. Strict separation of duties means you cannot also
                  decide on it — another Management user must review it.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => setDecisionModal({ item, decision: "APPROVE" })}
                    style={{
                      background: "#0f766e",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setDecisionModal({ item, decision: "REJECT" })}
                    style={{
                      background: "#ffffff",
                      color: "#b91c1c",
                      border: "1px solid #fca5a5",
                      borderRadius: 8,
                      padding: "9px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DECISION MODAL */}
      {decisionModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
          onClick={() => setDecisionModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              width: "100%",
              maxWidth: 480,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {decisionModal.decision === "APPROVE" ? "✅ Confirm Approval" : "❌ Confirm Rejection"}
            </h3>
            <p style={{ fontSize: 13, color: "#64748b" }}>{decisionModal.item.title}</p>

            <div
              style={{
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
                color: "#5b21b6",
                marginBottom: 14,
              }}
            >
              {decisionModal.decision === "APPROVE"
                ? "This executes exactly what the Admin submitted. Amounts, dates and days cannot be changed from here."
                : "Rejection withholds this action. It does not undo or reverse anything else already in the system."}
            </div>

            <form action={decisionModal.item.decideAction} method="post">
              <input type="hidden" name={CSRF_FIELD} value={csrfToken} />
              <input type="hidden" name="decision" value={decisionModal.decision} />
              {decisionModal.item.decideField === "requestId" && (
                <input type="hidden" name="requestId" value={decisionModal.item.mcId} />
              )}

              <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                Decision Notes {decisionModal.decision === "REJECT" ? "(required)" : "(optional)"}
              </label>
              <textarea
                name="decisionNotes"
                required={decisionModal.decision === "REJECT"}
                rows={3}
                style={{
                  width: "100%",
                  marginTop: 6,
                  marginBottom: 16,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
                placeholder={
                  decisionModal.decision === "REJECT"
                    ? "Explain why this is being rejected..."
                    : "Optional remarks for the audit trail..."
                }
              />

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setDecisionModal(null)}
                  style={{
                    background: "#ffffff",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: "9px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: decisionModal.decision === "APPROVE" ? "#0f766e" : "#b91c1c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {decisionModal.decision === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
