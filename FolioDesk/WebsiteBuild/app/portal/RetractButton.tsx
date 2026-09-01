"use client";

import { useState } from "react";

export default function RetractButton() {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="button secondary"
        style={{
          color: "#dc2626",
          borderColor: "#fca5a5",
          background: "#fff",
          fontSize: 13,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
        title="Retract your FolioDesk affiliateship"
      >
        <span>🛑</span> Retract Affiliateship
      </button>

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              maxWidth: 520,
              width: "100%",
              padding: 28,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              border: "1px solid #cbd5e1",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>🛑</span>
              <h3 style={{ margin: 0, fontSize: 20, color: "#991b1b" }}>Retract Affiliateship?</h3>
            </div>

            <p style={{ color: "#334155", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              Retracting your affiliateship is <b>effective immediately</b> and does not require approval.
            </p>

            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#991b1b", fontSize: 13, lineHeight: 1.5 }}>
                <li>Your profile will switch to <b>read-only mode</b> with no further profile editing.</li>
                <li>Your status will be updated to <b>RETRACTED</b>.</li>
                <li>
                  <b>Commissions Protected:</b> You will <b>continue to earn</b> your affiliate commissions for businesses and downlines introduced while you were active.
                </li>
              </ul>
            </div>

            <form
              action="/foliodesk/api/profile/retract"
              method="post"
              onSubmit={() => setSubmitting(true)}
              style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                style={{ fontSize: 14 }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Retracting..." : "Confirm Retraction"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
