"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav({
  currentDataMode = "TEST",
}: {
  currentDataMode?: "TEST" | "ACTUAL" | "ALL";
}) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "🌿 Affiliate Network & Hierarchy" },
    { href: "/admin/approvals", label: "⚡ Pending Approvals Inbox" },
    { href: "/admin/deals", label: "📊 Sales Funnel & Deal Pipeline" },
    { href: "/admin/invoices", label: "📄 Issued Tax Invoices" },
    { href: "/admin/collections", label: "⚖️ Collections & Mgt Approval" },
    { href: "/admin/payouts", label: "💳 Payment Advices & Disbursements" },
    { href: "/admin/settings", label: "⚙️ Commission Settings" },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
      }}
    >
      {/* 1. Sub-Nav Navigation Links */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          background: "#f1f5f9",
          padding: "6px",
          borderRadius: 10,
          border: "1px solid #e2e8f0",
        }}
      >
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin" || pathname === "/admin/"
              : pathname?.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                textDecoration: "none",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#0f766e" : "#475569",
                background: isActive ? "#ffffff" : "transparent",
                padding: "8px 16px",
                borderRadius: 8,
                boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                border: isActive ? "1px solid #cbd5e1" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* 2. Persistent Admin Data Mode Switcher */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fffbeb",
          padding: "4px 8px 4px 12px",
          borderRadius: 10,
          border: "1.5px solid #fde68a",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Data Filter Mode:</span>
        <form action="/foliodesk/api/admin/data-mode" method="post" style={{ display: "inline-flex", gap: 4 }}>
          <input type="hidden" name="redirectPath" value={pathname || "/admin"} />

          <button
            type="submit"
            name="mode"
            value="TEST"
            title="Show only test data records"
            style={{
              background: currentDataMode === "TEST" ? "#b45309" : "#ffffff",
              color: currentDataMode === "TEST" ? "#ffffff" : "#78350f",
              border: "1px solid #d97706",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🧪 Test Data (Default)
          </button>

          <button
            type="submit"
            name="mode"
            value="ACTUAL"
            title="Show only actual production data records"
            style={{
              background: currentDataMode === "ACTUAL" ? "#0f766e" : "#ffffff",
              color: currentDataMode === "ACTUAL" ? "#ffffff" : "#334155",
              border: "1px solid #0f766e",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            💼 Production / Actual
          </button>

          <button
            type="submit"
            name="mode"
            value="ALL"
            title="Show all records regardless of test status"
            style={{
              background: currentDataMode === "ALL" ? "#3b82f6" : "#ffffff",
              color: currentDataMode === "ALL" ? "#ffffff" : "#334155",
              border: "1px solid #3b82f6",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🌐 All Records
          </button>
        </form>
      </div>
    </div>
  );
}
