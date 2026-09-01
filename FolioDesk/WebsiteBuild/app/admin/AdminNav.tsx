"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "🌿 Affiliate Network & Hierarchy" },
    { href: "/admin/deals", label: "📊 Sales Funnel & Deal Pipeline" },
    { href: "/admin/collections", label: "⚖️ Collections & Mgt Approval" },
    { href: "/admin/payouts", label: "💳 Payment Advices & Disbursements" },
    { href: "/admin/settings", label: "⚙️ Commission Settings" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        background: "#f1f5f9",
        padding: "6px",
        borderRadius: 10,
        marginBottom: 24,
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
  );
}
