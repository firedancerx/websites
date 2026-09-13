import Link from "next/link";

export const metadata = {
  title: "Pricing | FolioDesk Marketing & Affiliate CRM",
  description: "Commercial licensing for FolioDesk SaaS & Affiliate CRM: 3-Year Annual License (RM 60,000) and Design Partner Lifetime License (RM 300,000).",
};

export default function PricingPage() {
  return (
    <section className="admin-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <div className="admin-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div className="eyebrow">TRANSPARENT COMMERCIAL MODEL</div>
          <h1>Commercial Licensing for FolioDesk Platform</h1>
          <p style={{ color: "#64748b", fontSize: 16, marginTop: 8, maxWidth: 700 }}>
            Enterprise software licensing for the FolioDesk Platform with integrated Affiliate Sales & CRM System. Transparent flat-block licensing without surprise per-user penalties.
          </p>
        </div>
        <Link href="/demo" className="button primary">Request a demo</Link>
      </div>

      {/* PRICING CARDS */}
      <div className="pricing-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 48 }}>
        <article className="price-card" style={{ border: "2px solid #0f766e" }}>
          <span className="pill" style={{ background: "#0f766e", color: "#fff" }}>ANNUAL ENTRY PLAN</span>
          <h3>5-User Annual License</h3>
          <strong>RM 60,000<small>/year</small></strong>
          <b>5 User Seats Included</b>
          <p style={{ marginBottom: 20 }}>
            Standard annual subscription license for growing project teams and single-entity contractors.
          </p>
          <ul style={{ textAlign: "left", fontSize: 14, color: "#334155", paddingLeft: 18, marginBottom: 24, lineHeight: 1.6 }}>
            <li>5 Operating User Seats</li>
            <li>Full Access to All Platform Features & Modules</li>
            <li>Multi-Tier Affiliate CRM & Referral Tracking</li>
            <li>3-Way PO Match & Retention Ledger</li>
            <li>Standard Email & Knowledgebase Support</li>
          </ul>
          <Link href="/demo">Request Annual License →</Link>
        </article>

        <article className="price-card featured" style={{ border: "2px solid var(--teal,#0f766e)" }}>
          <span className="pill">BEST VALUE (3-YEAR TERM)</span>
          <h3>3-Year 5-User License</h3>
          <strong>RM 158,000<small> (3-Year Term)</small></strong>
          <b>5 User Seats Included</b>
          <p style={{ marginBottom: 20 }}>
            Complete enterprise platform license for FolioDesk SaaS with multi-tier affiliate CRM, sales tracking, and project financial intelligence.
          </p>
          <ul style={{ textAlign: "left", fontSize: 14, color: "#334155", paddingLeft: 18, marginBottom: 24, lineHeight: 1.6 }}>
            <li>5 Operating User Seats</li>
            <li>Full Access to All Platform Features & Modules</li>
            <li>Multi-Tier Affiliate CRM & Referral Tracking</li>
            <li>SLA Protection & Lead Exclusivity Governance</li>
            <li>2-Tier Immutable Commission Lock Engine</li>
            <li>Real-Time Cash Cycle Visualizer Engine</li>
          </ul>
          <Link href="/demo">Request 3-Year License →</Link>
        </article>

        <article className="price-card" style={{ border: "2px solid #0284c7" }}>
          <span className="pill" style={{ background: "#0284c7", color: "#fff" }}>ENTERPRISE RESELLER</span>
          <h3>Unlimited Master Reseller License</h3>
          <strong>RM 1,200,000<small>/year</small></strong>
          <b>Unlimited Users, Unlimited Companies Annual License</b>
          <p style={{ marginBottom: 20 }}>
            Master commercial reseller license for corporate holding groups, conglomerate parent entities, and regional distributor networks.
          </p>
          <ul style={{ textAlign: "left", fontSize: 14, color: "#334155", paddingLeft: 18, marginBottom: 24, lineHeight: 1.6 }}>
            <li>Unlimited Users & Unlimited Sub-Entities/Companies</li>
            <li>Full Access to All Platform Features & Modules</li>
            <li>Annual License Commitment (Billed Annually)</li>
            <li>Master Multi-Company GL Consolidation</li>
            <li>Custom Billing & Direct Reseller Invoicing</li>
            <li>Dedicated Onboarding & 24/7 Priority SLA Support</li>
          </ul>
          <Link href="/demo">Contact Commercial Team →</Link>
        </article>

        <article className="price-card" style={{ background: "#f0fdf4", border: "2px solid #16a34a" }}>
          <span className="pill" style={{ background: "#16a34a", color: "#fff" }}>LIMITED EXCLUSIVE (MAX 10)</span>
          <h3>Design Partner License</h3>
          <strong>RM 300,000<small> (Perpetual)</small></strong>
          <b>Unlimited Users, 1 Company Perpetual License</b>
          <p style={{ marginBottom: 20 }}>
            Exclusive perpetual license for a single enterprise organization. Strictly limited to 10 founding design partners globally with zero recurring annual SaaS fees.
          </p>
          <ul style={{ textAlign: "left", fontSize: 14, color: "#334155", paddingLeft: 18, marginBottom: 24, lineHeight: 1.6 }}>
            <li>Unlimited Users for 1 Single Operating Company</li>
            <li>Full Access to All Platform Features & Modules</li>
            <li>Perpetual License (Zero Annual Renewal SaaS Fees)</li>
            <li>Executive VIP Support & SLA Guarantees</li>
            <li>Strict Cap: Maximum 10 Licenses Worldwide</li>
          </ul>
          <Link href="/demo">Apply for Design Partner License →</Link>
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

      {/* CALLOUT */}
      <div className="admin-card" style={{ background: "#0f766e", color: "#fff", padding: 32, borderRadius: 8, textAlign: "center" }}>
        <h3 style={{ fontSize: 24, color: "#fff", marginBottom: 8 }}>Ready to Transform Your Referral Network?</h3>
        <p style={{ color: "#ccfbf1", fontSize: 16, maxWidth: 650, margin: "0 auto 24px" }}>
          Schedule a product demonstration to explore FolioDesk&apos;s 3-Year License or apply for 1 of 10 global Design Partner Lifetime Licenses.
        </p>
        <Link href="/demo" className="button pale" style={{ display: "inline-block" }}>
          Schedule your product demonstration
        </Link>
      </div>
    </section>
  );
}
