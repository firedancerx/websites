"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// T-405 (plan §7.5): structurally mirrors AdminNav.tsx, scoped to the
// Management portal. Currently a single screen (the unified approval
// queue) -- more links can be added here as the Management portal grows,
// without touching the Admin nav.

export default function ManagementNav() {
  const pathname = usePathname();

  const links = [{ href: "/management/queue", label: "⚡ Approval Queue" }];

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
          const isActive = pathname?.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                textDecoration: "none",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#5b21b6" : "#475569",
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#f5f3ff",
          padding: "6px 14px",
          borderRadius: 10,
          border: "1.5px solid #ddd6fe",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6" }}>
          🔒 Dual-Control Checker Portal
        </span>
      </div>
    </div>
  );
}
