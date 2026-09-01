import React from "react";

export default function Logo({
  variant = "light",
  size = "normal",
}: {
  variant?: "light" | "dark";
  size?: "normal" | "large";
}) {
  const isDark = variant === "dark";
  const iconHeight = size === "large" ? 44 : 36;
  const iconWidth = size === "large" ? 40 : 33;
  const titleSize = size === "large" ? 26 : 22;
  const tagSize = size === "large" ? 9 : 7.5;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        textDecoration: "none",
        userSelect: "none",
        verticalAlign: "middle",
      }}
    >
      {/* THREE BLUE BOXES VECTOR ICON */}
      <svg
        width={iconWidth}
        height={iconHeight}
        viewBox="0 0 36 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, display: "block" }}
        aria-hidden="true"
      >
        {/* Top-Right Light Slate Blue Box */}
        <rect x="16" y="2" width="18" height="18" rx="4.5" fill="#88A2BE" />
        {/* Middle Steel Blue Box */}
        <rect x="9" y="11" width="18" height="18" rx="4.5" fill="#5A738E" />
        {/* Bottom-Left Dark Slate Box */}
        <rect x="2" y="20" width="18" height="18" rx="4.5" fill={isDark ? "#334155" : "#2D3F50"} />
      </svg>

      {/* TYPOGRAPHY */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", lineHeight: 1.15 }}>
        <div
          style={{
            fontFamily: "'Manrope', system-ui, -apple-system, sans-serif",
            fontSize: titleSize,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: isDark ? "#FFFFFF" : "#112D2B",
            margin: 0,
            padding: 0,
          }}
        >
          <span style={{ fontWeight: 800 }}>Folio</span>
          <span style={{ color: isDark ? "#93C5FD" : "#5A738E", fontWeight: 600 }}>Desk</span>
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
            fontSize: tagSize,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: isDark ? "#94A3B8" : "#5A738E",
            marginTop: 3,
            whiteSpace: "nowrap",
          }}
        >
          ENGINEERING FINANCIAL INTELLIGENCE
        </div>
      </div>
    </div>
  );
}
