import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "GenAI Product Vision & Trust Guardrails | FolioDesk",
  description: "Explore FolioDesk's GenAI roadmap for construction financial intelligence and strict 6-point privacy guardrails.",
};

const phases = [
  {
    phase: "Phase 1 · Target Q1 2027",
    title: "Conversational Analytics & OCR Automation",
    image: "/foliodesk/assets/images/genai/roadmap/GenAIPage_Sec02_Phase01_DocumentAI_BOQParser.png",
    items: [
      "AI Copilot v1 — Text-to-SQL conversational analytics ('Ask your project data questions in plain English')",
      "Intelligent Invoice Capture — OCR line-item extraction via Google Document AI feeding 3-way matching",
      "Smart BOQ Parser — Automated Bill-of-Quantities table extraction and WBS budget mapping",
    ],
  },
  {
    phase: "Phase 2 · Target Q3 2027",
    title: "Contract Intelligence & Risk Detection",
    image: "/foliodesk/assets/images/genai/roadmap/GenAIPage_Sec02_Phase02_ContractIntelligence_ClauseAudit.png",
    items: [
      "Contract Intelligence — Clause extraction and risk-flagging over contract corpus",
      "Project Cost Anomaly Detection — ML-based cost outlier and budget burn-rate flagging",
      "Vendor Risk Scoring — Predictive vendor failure scoring extending vendor scorecards",
      "Regulatory Compliance Assistant — Q&A over CIDB, BCA, MOM, and CIPAA/SOP regulatory corpus",
    ],
  },
  {
    phase: "Phase 3 · Target Q1 2028",
    title: "Predictive Cash Flow & Bid Intelligence",
    image: "/foliodesk/assets/images/genai/roadmap/GenAIPage_Sec02_Phase03_Predictive13WeekCashFlow_Forecast.png",
    items: [
      "13-Week AI Cash Flow Predictor — Flagship predictive cash gap forecasting to protect firm survival",
      "AI Progress Report Generator — Automated narrative progress report writing from live project data",
      "AI Tender Writer Assistant — GenAI-assisted bid and tender document drafting",
    ],
  },
];

const guardrails = [
  ["🔒 Zero Cross-Tenant Data Leakage", "Strict tenant isolation boundaries ensure tenant data is never exposed to another tenant."],
  ["🧼 Automated PII Scrubbing", "All personally identifiable information is scrubbed before any prompt leaves the platform."],
  ["📜 7-Year PDPA Audit Logging", "Complete prompt audit logging maintained for 7 years in compliance with PDPA regulations."],
  ["🙅 Zero Unconsented Model Training", "Tenant data is never used to train foundation models without explicit written consent."],
  ["🏷️ Mandatory AI Content Labeling", "Every AI-generated output is clearly labelled 'AI-generated — review before use'."],
  ["👤 Human Financial Approval Required", "Human approval is strictly required before any financial posting or ledger entry."],
];

export default function GenAIPage() {
  return (
    <section className="admin-wrap" style={{ maxWidth: 1160, margin: "0 auto", padding: "40px 20px" }}>
      {/* 01. HERO SECTION */}
      <div className="admin-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div className="eyebrow">INNOVATION & AI ROADMAP</div>
          <h1>Construction-Specific GenAI Vision</h1>
          <p style={{ color: "#64748b", fontSize: 16, marginTop: 8, maxWidth: 720 }}>
            Domain-specific artificial intelligence trained on construction financial dynamics—built with enterprise privacy guardrails.
          </p>
        </div>
        <Link href="/demo" className="button primary">Request a demo</Link>
      </div>

      {/* TEXT-TO-SQL COPILOT HERO GRAPHIC */}
      <div style={{ maxWidth: "100%", marginBottom: 44, borderRadius: 16, overflow: "hidden", background: "#0b0f17", border: "1px solid #1e293b", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
        <Image
          src="/foliodesk/assets/images/genai/hero/GenAIPage_Sec01_Hero_TextToSqlCopilot_Interface.png"
          alt="Text-to-SQL Terminal Interface Generating Read-Only Queries Against WBS/EVM Schema"
          width={1200}
          height={600}
          style={{ width: "100%", height: "auto", display: "block" }}
          priority
        />
      </div>

      {/* 02. ROADMAP PHASES & TIMELINE */}
      <h2 style={{ fontSize: 24, marginBottom: 12, color: "#0f172a" }}>Phased Innovation Roadmap</h2>
      
      {/* 3-PHASE TIMELINE OVERVIEW DIAGRAM */}
      <div style={{ maxWidth: "100%", marginBottom: 32, borderRadius: 12, overflow: "hidden", background: "#0b0f17", border: "1px solid #1e293b", padding: "16px" }}>
        <Image
          src="/foliodesk/assets/images/genai/roadmap/GenAIPage_Sec02_Roadmap_3PhaseTimeline_Overview.png"
          alt="3-Phase Horizontal Timeline Overview: Q1 2027 -> Q3 2027 -> Q1 2028"
          width={1000}
          height={180}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28, marginBottom: 48 }}>
        {phases.map((p, idx) => (
          <div
            key={idx}
            className="admin-card"
            style={{
              padding: 28,
              borderRadius: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--teal,#0f766e)", textTransform: "uppercase", letterSpacing: "1px" }}>
                {p.phase}
              </span>
              <h3 style={{ fontSize: 21, marginTop: 4, marginBottom: 12, color: "#0f172a" }}>{p.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#334155", fontSize: 14.5, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 8 }}>
                {p.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={{ borderRadius: 12, overflow: "hidden", background: "#0b0f17", border: "1px solid #1e293b" }}>
              <Image
                src={p.image}
                alt={p.title}
                width={480}
                height={260}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 03. 6-POINT PRIVACY TRUST GUARDRAILS & SECURITY TOPOLOGY */}
      <div style={{ background: "#f8fafc", padding: 36, borderRadius: 16, border: "1px solid #cbd5e1" }}>
        <h2 style={{ fontSize: 24, marginBottom: 8, color: "#0f172a" }}>6-Point AI Privacy & Trust Guardrails</h2>
        <p style={{ color: "#64748b", fontSize: 15, marginBottom: 28 }}>
          We treat enterprise financial security as a core architectural discipline—not an afterthought.
        </p>

        {/* 6-POINT PRIVACY SECURITY ARCHITECTURE DIAGRAM */}
        <div style={{ maxWidth: "100%", marginBottom: 32, borderRadius: 12, overflow: "hidden", background: "#0b0f17", border: "1px solid #1e293b", padding: "16px" }}>
          <Image
            src="/foliodesk/assets/images/genai/privacy/GenAIPage_Sec03_Privacy_6PointSecurityArchitecture_Diagram.png"
            alt="6-Point Enterprise Privacy Architecture: PII Filter, ZDR Proxy, 7-Yr PDPA WORM Log"
            width={1000}
            height={320}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {guardrails.map(([title, desc], i) => (
            <div key={i} style={{ background: "#fff", padding: 18, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <h4 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>{title}</h4>
              <p style={{ fontSize: 13.5, color: "#475569", margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
