"use client";

import { useState, useEffect } from "react";

export default function CopyReferralLink({
  affiliateCode,
  compact = false,
}: {
  affiliateCode: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState<string>("");

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:80";
    setFullUrl(`${origin}/foliodesk/register?upline=${affiliateCode}`);
  }, [affiliateCode]);

  const displayUrl = fullUrl || `http://127.0.0.1:80/foliodesk/register?upline=${affiliateCode}`;

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(displayUrl);
      } else {
        // Fallback selection copy
        const textarea = document.createElement("textarea");
        textarea.value = displayUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy referral link:", err);
    }
  };

  if (compact) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <input
          type="text"
          readOnly
          value={displayUrl}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          style={{
            fontSize: 12,
            fontFamily: "monospace",
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            background: "#f8fafc",
            color: "#0f172a",
            width: 280,
          }}
        />
        <button
          type="button"
          onClick={copyToClipboard}
          className="button secondary"
          style={{
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 700,
            background: copied ? "#10b981" : "#0f766e",
            color: "#ffffff",
            borderColor: copied ? "#059669" : "#0d9488",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {copied ? "✓ Copied!" : "📋 Copy Link"}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
        border: "1.5px solid #0284c7",
        borderRadius: 10,
        padding: "20px 24px",
        marginBottom: 24,
        boxShadow: "0 4px 14px rgba(2, 132, 199, 0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🔗</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: "#0369a1", fontWeight: 700 }}>
              Your Copyable Referral Link
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#0284c7" }}>
              Domain + Affiliate Code GET query statement for downline invitations & marketing
            </p>
          </div>
        </div>
        <span
          style={{
            background: "#0284c7",
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.5px",
            padding: "4px 10px",
            borderRadius: 99,
          }}
        >
          CODE: {affiliateCode}
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
        <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
          <input
            type="text"
            readOnly
            value={displayUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 14,
              fontFamily: "monospace",
              fontWeight: 600,
              color: "#0f172a",
              background: "#ffffff",
              border: "1.5px solid #0284c7",
              borderRadius: 8,
              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          />
        </div>
        <button
          type="button"
          onClick={copyToClipboard}
          style={{
            background: copied ? "#059669" : "#0284c7",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: copied ? "0 2px 8px rgba(5, 150, 105, 0.3)" : "0 2px 8px rgba(2, 132, 199, 0.3)",
            transition: "all 0.2s ease",
          }}
        >
          <span>{copied ? "✓" : "📋"}</span>
          <span>{copied ? "Copied to Clipboard!" : "Copy Referral Link"}</span>
        </button>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#334155" }}>
        <span>
          💡 <b>GET Parameter Syntax:</b> <code>?upline={affiliateCode}</code> (also accepts <code>?ref={affiliateCode}</code>)
        </span>
        <span>
          🎯 <b>Auto-Fill:</b> Registrations from this link automatically pre-fill your Upline Code.
        </span>
      </div>
    </div>
  );
}
