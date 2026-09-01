import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Platform Capabilities | FolioDesk",
  description: "Explore FolioDesk's 6 core functional modules built specifically for engineering firms and contractors.",
};

const modules = [
  {
    id: "sales",
    title: "01. Sales & CRM (sales-service)",
    headline: "System-Enforced Contract Ceilings & Variation Order Control",
    description:
      "Manage quotations, contracts, and variation orders with system-enforced guardrails that prevent claim overruns before they happen.",
    image: "/foliodesk/assets/images/platform/modules/PlatformPage_Sec02_Module01_CRM_ContractCeilingGuardrail.png",
    features: [
      "Auto-numbered quotations with validity and expiry auto-tracking",
      "Contract management enforcing progress claims NEVER exceed total contract value (OVERCLAIM rejection)",
      "Variation Order (VO) approval workflows that automatically update running contract sum",
      "5-stage CRM pipeline with stage-aging alerts and automatic sales director escalation",
    ],
  },
  {
    id: "procurement",
    title: "02. Purchase & Procurement (purchase-service)",
    headline: "Automated 3-Way Match & Dynamic Vendor Scorecards",
    description:
      "Control committed spend with threshold approval rules and automated invoice verification that eliminates duplicate or unverified supplier payments.",
    image: "/foliodesk/assets/images/platform/modules/PlatformPage_Sec02_Module02_Procurement_3WayMatchScorecard.png",
    features: [
      "Threshold-based PO auto-approval routing (e.g. > RM 10,000 auto-escalated)",
      "Automated Three-Way Match (PO vs. GRN vs. Invoice) — auto-creates AP vouchers on PASS; flags and holds on mismatch",
      "Vendor Scorecard tracking On-Time Delivery (40%), Quality (40%), and Invoice Accuracy (20%)",
      "Automatic vendor tiering with score-based downgrade alerts for low performance",
    ],
  },
  {
    id: "projects",
    title: "03. Project Management & EVM (project-service)",
    headline: "Live Earned Value Management & 30-Second Cost Recalculation",
    description:
      "Track real-time CPI and SPI cost performance while there is still time to protect project margins.",
    image: "/foliodesk/assets/images/platform/modules/PlatformPage_Sec02_Module03_EVM_30SecRecalculationEngine.png",
    features: [
      "Work Breakdown Structure (WBS) up to 6 levels with automatic cost roll-up",
      "Earned Value Management (EVM): Live CPI, SPI, EAC (Estimate at Completion), and VAC calculation",
      "EVM metrics recalculated within 30 seconds of jobsite timesheet approval",
      "Automatic threshold alerts: CPI < 0.85 alerts PM; CPI < 0.70 escalates directly to Managing Director",
    ],
  },
  {
    id: "inventory",
    title: "04. Inventory & Materials Control (inventory-service)",
    headline: "Curing Evaporating Inventory & Project Material Loss",
    description:
      "Stop material scrap and site loss from silently bleeding cash from project profits.",
    image: "/foliodesk/assets/images/platform/modules/PlatformPage_Sec02_Module04_Inventory_DualCostingScrapMatrix.png",
    features: [
      "Dual costing methods: FIFO default for Project Engineering; Weighted Average default for Trading",
      "Auto-selected costing based on business operational mode",
      "Physical inventory scrap, disposal, and shrinkage tracking",
      "Reorder threshold management with automated stock replenishment alerts",
    ],
  },
  {
    id: "shopfloor",
    title: "05. Shop Floor & Field Mobile (shopfloor-service)",
    headline: "Offline-First Mobile Timesheets & Geofenced Attendance",
    description:
      "Capture field activity accurately regardless of jobsite connectivity condition.",
    image: "/foliodesk/assets/images/platform/modules/PlatformPage_Sec02_Module05_Shopfloor_OfflineGeofenceSync.png",
    features: [
      "Offline-first mobile timesheets for site supervisors, syncing automatically upon reconnection",
      "Geofenced jobsite attendance verification",
      "Overtime safeguards: Timesheets > 12 hours/day require explicit PM approval",
      "Overall Equipment Effectiveness (OEE) scoring for fabrication machinery",
    ],
  },
  {
    id: "finance",
    title: "06. Finance & Retention Ledger (finance-service)",
    headline: "Native Retention Money Ledgers & Statutory Payment Clocks",
    description:
      "Protect balance sheet retention holdbacks and comply with regional statutory payment laws.",
    image: "/foliodesk/assets/images/platform/modules/PlatformPage_Sec02_Module06_Finance_RetentionCIPAAClock.png",
    features: [
      "Dedicated Retention Money Ledger for 5–10% contract holdbacks across 2 release tranches",
      "Statutory Payment Clocks: Countdown tracking for CIPAA (30 days in MY) and SOP Act (35 days in SG)",
      "Foreign Worker Levy allocation: Directly assigns SGD 300–900 / RM 150–500 monthly levies to project cost centers",
      "Automated AR invoice draft creation directly from certified milestones and progress claims",
    ],
  },
];

export default function PlatformPage() {
  return (
    <section className="admin-wrap" style={{ maxWidth: 1160, margin: "0 auto", padding: "40px 20px" }}>
      {/* 01. ARCHITECTURE HEADER */}
      <div className="admin-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div className="eyebrow">FOLIODESK ARCHITECTURE</div>
          <h1>Six Core Functional Modules</h1>
          <p style={{ color: "#64748b", fontSize: 16, marginTop: 8, maxWidth: 720 }}>
            Purpose-built microservices architecture designed to connect field operations, procurement, and project accounting into one live financial operating picture.
          </p>
        </div>
        <Link href="/demo" className="button primary">Request a demo</Link>
      </div>

      {/* TOPOLOGY ARCHITECTURE DIAGRAM */}
      <div style={{ maxWidth: "100%", marginBottom: 40, borderRadius: 16, overflow: "hidden", background: "#0b0f17", border: "1px solid #1e293b", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
        <Image
          src="/foliodesk/assets/images/platform/architecture/PlatformPage_Sec01_Arch_MicroservicesDataBus_Topology.png"
          alt="Microservices Event Bus Linking 6 Service Nodes to Immutable Transactional Ledger"
          width={1200}
          height={600}
          style={{ width: "100%", height: "auto", display: "block" }}
          priority
        />
      </div>

      {/* 02. 2-COLUMN SPLIT MODULE CARDS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        {modules.map((m) => (
          <div
            key={m.id}
            id={m.id}
            className="admin-card"
            style={{
              padding: 32,
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 28,
              alignItems: "center",
            }}
          >
            {/* LEFT COLUMN: CAPABILITIES */}
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--teal,#0f766e)", letterSpacing: "1px", textTransform: "uppercase" }}>
                {m.title}
              </span>
              <h2 style={{ fontSize: 23, marginTop: 6, marginBottom: 8, color: "#0f172a" }}>{m.headline}</h2>
              <p style={{ color: "#475569", fontSize: 15, marginBottom: 18 }}>{m.description}</p>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>Key Capabilities & Technical Features:</h4>
              <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {m.features.map((f, i) => (
                  <li key={i} style={{ color: "#334155", fontSize: 13.5, lineHeight: 1.5 }}>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT COLUMN: TECHNICAL UI SCHEMATIC */}
            <div style={{ borderRadius: 12, overflow: "hidden", background: "#0b0f17", border: "1px solid #1e293b", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <Image
                src={m.image}
                alt={m.headline}
                width={480}
                height={280}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 03. REGIONAL CONFIGURATOR CTA */}
      <div style={{ marginTop: 48, padding: 36, background: "#f8fafc", borderRadius: 16, textAlign: "center", border: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 280, margin: "0 auto 16px" }}>
          <Image
            src="/foliodesk/assets/images/platform/cta/PlatformPage_Sec03_CTA_RegionalConfigurator_Badge.png"
            alt="Regional Jurisdiction Selector Badge"
            width={280}
            height={60}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
        <h3 style={{ fontSize: 24, marginBottom: 8, color: "#0f172a" }}>Ready to see the platform in action?</h3>
        <p style={{ color: "#64748b", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
          Schedule a personalized demonstration configured to match how your engineering firm operates in Malaysia or Singapore.
        </p>
        <Link href="/demo" className="button primary">
          Book a 30-minute demo
        </Link>
      </div>
    </section>
  );
}
