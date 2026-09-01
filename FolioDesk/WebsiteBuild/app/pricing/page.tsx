import Link from "next/link";
import { currentUser } from "../../lib/auth";

export const metadata = {
  title: "Pricing | FolioDesk",
  description: "Transparent annual flat-block pricing for engineering firms and SME construction contractors.",
};

export default async function PricingPage() {
  const user = await currentUser();
  return (
    <section className="admin-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <div className="admin-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div className="eyebrow">TRANSPARENT COMMERCIAL MODEL</div>
          <h1>Right-Sized Pricing for Engineering Firms</h1>
          <p style={{ color: "#64748b", fontSize: 16, marginTop: 8, maxWidth: 700 }}>
            No surprise seat fees or fragile third-party add-ons. Cloud-native project financial intelligence priced for growing engineering firms—not enterprise software retrofitted downward.
          </p>
        </div>
        <Link href="/demo" className="button primary">Request a demo</Link>
      </div>

      {/* PRICING CARDS */}
      <div className="pricing-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 48 }}>
        <article className="price-card featured" style={{ border: "2px solid var(--teal,#0f766e)" }}>
          <span className="pill">STANDARD TENANT BLOCK</span>
          <h3>5-User Operating Block</h3>
          <strong>RM 60,000<small>/year</small></strong>
          <b>5 Core User Seats Included</b>
          <p style={{ marginBottom: 20 }}>
            Full platform access for engineering contractors. Scalable in additional 5-user block increments.
          </p>
          <ul style={{ textAlign: "left", fontSize: 14, color: "#334155", paddingLeft: 18, marginBottom: 24, lineHeight: 1.6 }}>
            <li>All 6 Core Modules included</li>
            <li>Real-time EVM (CPI / SPI / EAC / VAC)</li>
            <li>Automated 3-Way Match (PO / GRN / Invoice)</li>
            <li>Retention Money Ledgers & DLP Tracking</li>
            <li>CIPAA 30d & SOP 35d Statutory Clocks</li>
            <li>Offline-First Mobile Field Timesheets</li>
            <li>Vendor Scorecards & Tiering</li>
          </ul>
          <Link href="/demo">Request Standard License →</Link>
        </article>

        <article className="price-card">
          <h3>Master Tenant License</h3>
          <strong>RM 120,000<small>/year</small></strong>
          <b>Multi-Entity Consolidation</b>
          <p style={{ marginBottom: 20 }}>
            For established engineering groups managing multiple sub-tenant legal entities under one consolidated account.
          </p>
          <ul style={{ textAlign: "left", fontSize: 14, color: "#334155", paddingLeft: 18, marginBottom: 24, lineHeight: 1.6 }}>
            <li>Includes all Standard Tenant capabilities</li>
            <li>Multi-company GL consolidation</li>
            <li>Centralized master procurement & vendors</li>
            <li>Cross-entity project performance reports</li>
            <li>Single consolidated billing invoice</li>
            <li>Dedicated onboarding specialist</li>
          </ul>
          <Link href="/demo">Contact Commercial Team →</Link>
        </article>
      </div>

      {/* COMMERCIAL DETAILS & TERMS */}
      <div className="admin-card" style={{ background: "#f8fafc", padding: 24, borderRadius: 8, marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, marginBottom: 12 }}>Commercial Terms & Billing Rules</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Annual SaaS Billing</h4>
            <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
              All subscriptions are billed annually in advance. Invoiced in MYR for Malaysia entities and SGD equivalent for Singapore entities.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Year 2+ Advance Payment Discount</h4>
            <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
              Save 5% per month for pre-paid annual renewals (capped at 60% maximum discount), starting from Year 2 onward. Year 1 is full price.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Zero Infrastructure Overhead</h4>
            <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
              Cloud-native delivery with automatic updates, continuous backups, and 99.9% uptime SLA. Nothing to install, nothing to maintain.
            </p>
          </div>
        </div>
      </div>

      {/* ROI CALCULATOR CALLOUT */}
      <div className="admin-card" style={{ background: "#0f766e", color: "#fff", padding: 32, borderRadius: 8, textAlign: "center" }}>
        <h3 style={{ fontSize: 24, color: "#fff", marginBottom: 8 }}>Ready to Protect Your Project Margins?</h3>
        <p style={{ color: "#ccfbf1", fontSize: 16, maxWidth: 650, margin: "0 auto 24px" }}>
          See how FolioDesk pays for itself by catching a single untracked Variation Order or preventing invoice double-payments.
        </p>
        <Link href="/demo" className="button pale" style={{ display: "inline-block" }}>
          Schedule your product demonstration
        </Link>
      </div>
    </section>
  );
}
