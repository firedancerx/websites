import Link from "next/link";
import Image from "next/image";
import { currentUser } from "../lib/auth";

export const metadata = {
  title: "FolioDesk | Project Financial Intelligence for Engineering Firms",
  description: "Project financial intelligence software for engineering contractors and construction SMEs in Malaysia and Singapore.",
};

const capabilities = [
  {
    title: "01. Sales & CRM",
    text: "Auto-numbered quotations, Variation Order tracking, and system-enforced contract ceilings to prevent claim overruns.",
    href: "/platform#sales",
    image: "/foliodesk/assets/images/homepage/modules/HomePage_Sec04_Module01_CRM_TenderMargin_Micro.png",
  },
  {
    title: "02. Purchase & Procurement",
    text: "Automated 3-way match (PO/GRN/Invoice) with threshold approvals and dynamic vendor performance scorecards.",
    href: "/platform#procurement",
    image: "/foliodesk/assets/images/homepage/modules/HomePage_Sec04_Module02_Procurement_3WayMatch_Micro.png",
  },
  {
    title: "03. Earned Value Management",
    text: "Live WBS up to 6 levels. CPI and SPI recalculated within 30 seconds of timesheet approval for proactive overrun alerts.",
    href: "/platform#projects",
    image: "/foliodesk/assets/images/homepage/modules/HomePage_Sec04_Module03_EVM_SCurveGauge_Micro.png",
  },
  {
    title: "04. Evaporating Inventory Control",
    text: "Dual costing (FIFO for Project Engineering; Weighted Average for Trading) with physical loss and scrap tracking.",
    href: "/platform#inventory",
    image: "/foliodesk/assets/images/homepage/modules/HomePage_Sec04_Module04_Inventory_SiteTransfer_Micro.png",
  },
  {
    title: "05. Offline Mobile Field Timesheets",
    text: "Offline-first jobsite attendance with geofence verification and 12-hour overtime safeguard controls.",
    href: "/platform#shopfloor",
    image: "/foliodesk/assets/images/homepage/modules/HomePage_Sec04_Module05_Timesheets_Geofence_Micro.png",
  },
  {
    title: "06. Finance & Retention Ledger",
    text: "Dedicated retention ledgers for 5–10% holdbacks and automated statutory payment clocks (CIPAA 30d / SOP 35d).",
    href: "/platform#finance",
    image: "/foliodesk/assets/images/homepage/modules/HomePage_Sec04_Module06_Ledger_BillingWaterfall_Micro.png",
  },
];

export default async function Home() {
  const user = await currentUser();
  const profilePath = "/portal";

  return (
    <>
      {/* 01. HERO SECTION */}
      <section className="hero">
        <div className="eyebrow">PROJECT FINANCIAL INTELLIGENCE · MALAYSIA + SINGAPORE</div>
        <h1>Know where every project is making—or losing—money.</h1>
        <p className="hero-copy">
          FolioDesk connects project costs, billing, procurement, timesheets and cash flow into one live operating picture. Stop discovering project profitability at closeout.
        </p>
        <div className="actions">
          <Link className="button primary" href="/demo">Request a product demo</Link>
          <Link className="button secondary" href="/cash-cycle">Explore the Cash Cycle model</Link>
        </div>

        {/* HERO ISOMETRIC VISUAL */}
        <div style={{ maxWidth: 1040, margin: "0 auto 36px", borderRadius: 20, overflow: "hidden", border: "1px solid #1e293b", background: "#0b0f17", boxShadow: "0 25px 60px rgba(17,45,43,.25)" }}>
          <Image
            src="/foliodesk/assets/images/homepage/hero/HomePage_Sec01_Hero_FieldToBoardroom_Isometric.png"
            alt="Field to Boardroom Telemetry Composite"
            width={1200}
            height={675}
            priority
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        {/* HERO PORTFOLIO CONTROL DASHBOARD PREVIEW */}
        <div className="hero-board" aria-label="Sample project margin dashboard">
          <div className="board-top">
            <span>PORTFOLIO CONTROL · LIVE CPI / SPI</span>
            <b>12 Active Projects</b>
          </div>
          <div className="metrics">
            <article>
              <small>Contract Value</small>
              <strong>RM 18.4m</strong>
              <em>Across live projects</em>
            </article>
            <article>
              <small>Forecast Margin</small>
              <strong>9.8%</strong>
              <em className="good">+1.4 pts this month</em>
            </article>
            <article>
              <small>Cash Due (30 Days)</small>
              <strong>RM 1.26m</strong>
              <em>8 certified progress claims</em>
            </article>
          </div>
          <div className="project-row">
            <span>FD-2408 · Plant Retrofit (CPI: 1.08 / SPI: 1.02)</span>
            <div className="bar"><i style={{ width: "76%" }} /></div>
            <b>11.2%</b>
          </div>
          <div className="project-row">
            <span>FD-2411 · M&E Package (CPI: 0.82 - Alert Triggered)</span>
            <div className="bar"><i className="amber" style={{ width: "51%" }} /></div>
            <b style={{ color: "#d97706" }}>6.4%</b>
          </div>
        </div>
      </section>

      {/* TARGET MARKET STRIP */}
      <section className="trust-strip">
        <span>Purpose-Built For</span>
        <b>Engineering Contractors</b>
        <b>Construction SMEs (CIDB G2–G7 / BCA)</b>
        <b>Custom Fabricators</b>
        <b>Specialist Subcontractors</b>
      </section>

      {/* 02. THE CATEGORY GAP / POSITIONING */}
      <section className="dark-section">
        <div>
          <div className="section-kicker light">THE MARKET GAP FOLIODESK FILLS</div>
          <h2>More control than accounting software. Less weight than enterprise ERP.</h2>
          <p style={{ color: "#94a3b8", maxWidth: 760, fontSize: 18, marginTop: 12 }}>
            Engineering firms in the region have outgrown spreadsheets but are too specialized for generic ERP. The market gap sits precisely between the two.
          </p>
        </div>

        {/* 3-WAY TOPOLOGY DIAGRAM */}
        <div style={{ maxWidth: 1040, margin: "40px auto 32px", borderRadius: 16, overflow: "hidden", background: "#131b2a", border: "1px solid #1e293b", padding: "20px" }}>
          <Image
            src="/foliodesk/assets/images/homepage/positioning/HomePage_Sec02_Positioning_3WayTopology_Diagram.png"
            alt="3-Way Architecture: Disconnected Sheets vs FolioDesk Engine vs Monolith ERP"
            width={1000}
            height={420}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        <div className="comparison">
          <article>
            <small>TOO LITTLE CONTROL</small>
            <h3>Spreadsheets + Generic Accounting</h3>
            <p>Affordable, but project costs, field timesheets, retention, and progress claims remain disconnected. Profitability is discovered at closeout.</p>
          </article>
          <article className="active">
            <small>THE RIGHT FIT</small>
            <h3>FolioDesk</h3>
            <p>Construction-specific project financial intelligence. Native retention ledgers, EVM, 3-way PO match, and CIPAA/SOP statutory clocks.</p>
          </article>
          <article>
            <small>TOO MUCH WEIGHT</small>
            <h3>Enterprise ERP</h3>
            <p>Powerful, but priced and configured for multinational conglomerates. Expensive, implementation-heavy, and hard to operate for SMEs.</p>
          </article>
        </div>
      </section>

      {/* 03. THE CASH CYCLE SECTION */}
      <section className="section" style={{ background: "#f8fafc" }}>
        <div className="section-kicker">THE CORE OPERATING MODEL</div>
        <h2>The 3-Leg Cash Cycle</h2>
        <p className="section-intro">
          Every functional category in FolioDesk exists to serve one business reality: the movement of Cash out into committed obligations and back again as collected revenue.
        </p>

        {/* CLOSED-LOOP PIPELINE DIAGRAM */}
        <div style={{ maxWidth: 1040, margin: "36px auto 32px", borderRadius: 16, overflow: "hidden", background: "#ffffff", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <Image
            src="/foliodesk/assets/images/homepage/cash-cycle/HomePage_Sec03_CashCycle_ClosedLoopPipeline_Diagram.png"
            alt="3-Leg Closed Loop Cash Cycle Pipeline"
            width={1040}
            height={380}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 24 }}>
          <article className="feature-card" style={{ background: "#fff" }}>
            <span>LEG 1</span>
            <h3>Outbound Cash</h3>
            <p>Cash funds non-recoverable overheads and committed purchases through creditors on strict credit terms.</p>
          </article>
          <article className="feature-card" style={{ background: "#fff" }}>
            <span>LEG 2</span>
            <h3>Conversion & WIP</h3>
            <p>Purchases become raw materials ➔ consumed by WBS projects ➔ converted through Work-in-Progress into deliverables.</p>
          </article>
          <article className="feature-card" style={{ background: "#fff" }}>
            <span>LEG 3</span>
            <h3>Realisation & Collection</h3>
            <p>Finished output is certified via IPC/progress claims, creating debtors whose payment returns to cash, closing the cycle.</p>
          </article>
        </div>
      </section>

      {/* 04. CORE 6 MODULE CAPABILITIES */}
      <section id="platform" className="section">
        <div className="section-kicker">BUILT FOR INDUSTRY DEMANDS</div>
        <h2>Six Core Functional Modules</h2>
        <p className="section-intro">
          Replace fragmented toolchains with a single live financial operating system.
        </p>
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {capabilities.map((item) => (
            <article className="feature-card" key={item.title} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ width: "100%", height: 140, marginBottom: 18, borderRadius: 12, overflow: "hidden", background: "#0b0f17", border: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={240}
                    height={120}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
                <h3 style={{ marginTop: 0 }}>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <Link href={item.href} style={{ color: "var(--teal,#0f766e)", fontWeight: 600, fontSize: 14, display: "inline-block", marginTop: 16 }}>
                Explore module details →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* 05. PRICING & 3-WEEK DEPLOYMENT */}
      <section id="pricing" className="section" style={{ background: "#fff" }}>
        <div className="section-kicker">TRANSPARENT COMMERCIAL MODEL</div>
        <h2>Flat-Block Annual Subscription</h2>
        <p className="section-intro">
          SaaS-only, annual billing. Right-sized for engineering firms without hidden enterprise seat costs.
        </p>
        <div className="pricing-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, maxWidth: 900, margin: "32px auto 0" }}>
          <article className="price-card featured">
            <span className="pill">STANDARD TENANT</span>
            <h3>5-User Operating Block</h3>
            <strong>RM 60,000<small>/year</small></strong>
            <b>5 Full User Seats Included</b>
            <p>Complete access to all 6 modules: EVM, Procurement 3-Way Match, Inventory, Timesheets, and Retention Ledgers.</p>
            <Link href="/demo">Schedule a demo →</Link>
          </article>
          <article className="price-card">
            <h3>Master Tenant License</h3>
            <strong>RM 120,000<small>/year</small></strong>
            <b>Multi-Entity Consolidation</b>
            <p>For engineering groups operating multiple legal sub-tenant entities under a single consolidated invoice.</p>
            <Link href="/demo">Talk to FolioDesk →</Link>
          </article>
        </div>

        {/* 3-WEEK RAPID ONBOARDING ROADMAP */}
        <div style={{ maxWidth: 900, margin: "48px auto 0", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
          <div className="section-kicker" style={{ marginBottom: 8 }}>3-WEEK RAPID ONBOARDING</div>
          <h3 style={{ fontSize: 22, margin: "0 0 16px", color: "#0f172a" }}>Predictable Implementation Timeline</h3>
          <p style={{ color: "#64748b", fontSize: 14, maxWidth: 640, margin: "0 auto 20px" }}>
            From Master Data and BOM cost codes import to full mobile field crew rollout and live Earned Value S-Curve margin tracking in 21 days.
          </p>
          <Image
            src="/foliodesk/assets/images/homepage/pricing/HomePage_Sec05_Pricing_3WeekDeployment_Roadmap.png"
            alt="3-Week Rapid Deployment Roadmap: Master Data -> Field Crew -> Live S-Curve"
            width={860}
            height={220}
            style={{ width: "100%", height: "auto", display: "block", margin: "0 auto" }}
          />
        </div>

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link href="/pricing" style={{ color: "var(--teal,#0f766e)", fontWeight: 600 }}>
            View complete pricing model & pre-paid discount terms →
          </Link>
        </div>
      </section>

      {/* AFFILIATE CTA BANNER */}
      <section className="affiliate-cta">
        <div>
          <div className="section-kicker light">FOLIODESK AFFILIATE PROGRAMME</div>
          <h2>Help project firms protect their margin.</h2>
          <p>Apply at zero cost. Refer qualified engineering firms, track progress, and earn performance-based commissions.</p>
        </div>
        {user ? (
          <Link className="button pale" href={profilePath}>My Profile</Link>
        ) : (
          <Link className="button pale" href="/register">Apply to join</Link>
        )}
      </section>
    </>
  );
}
