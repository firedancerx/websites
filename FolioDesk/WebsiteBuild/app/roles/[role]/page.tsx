import Link from "next/link";
import { notFound } from "next/navigation";

interface RoleData {
  title: string;
  roleName: string;
  headline: string;
  painPoints: string[];
  solutions: string[];
}

const personaData: Record<string, RoleData> = {
  ceo: {
    title: "For Owners, Directors & CEOs",
    roleName: "Owner / Director / CEO",
    headline: "Stop Discovering Project Profitability at Closeout",
    painPoints: [
      "Project profitability is discovered after the project ends, when it's too late to recover lost margins.",
      "Fragmented toolchains (spreadsheets + generic accounting) conceal margin erosion until cashflow breaks.",
      "No executive visibility into live Earned Value metrics across portfolio projects.",
    ],
    solutions: [
      "Live Executive Dashboard with real-time CPI, SPI, EAC (Estimate at Completion), and VAC across all active projects.",
      "Automated Director-level escalation alerts when project CPI drops below 0.70 or deals stall in negotiation.",
      "Flat, predictable RM-block pricing designed for growing engineering firms without hidden seat penalties.",
    ],
  },
  finance: {
    title: "For Finance & Accounts Managers",
    roleName: "Finance & Accounts Manager",
    headline: "Automated 3-Way Invoice Matching & Retention Ledgers",
    painPoints: [
      "No native ledger for 5–10% retention money tranches and Defects Liability Period (DLP) release tracking.",
      "Manual three-way matching of POs, Goods Received Notes (GRN), and vendor invoices causes payment delays and errors.",
      "Statutory payment certification countdowns (CIPAA 30d / SOP 35d) tracked by memory, risking loss of legal rights.",
    ],
    solutions: [
      "Automated Three-Way Match (PO / GRN / Invoice) that auto-creates AP vouchers on pass and flags mismatches.",
      "Native Retention Money Ledger tracking release tranches and DLP expiry dates per project.",
      "Automated Statutory Payment Clocks keeping your firm fully compliant with CIPAA (MY) and SOP Act (SG).",
    ],
  },
  pm: {
    title: "For Project Managers & Site Leaders",
    roleName: "Project Manager",
    headline: "Live WBS Cost Roll-up & 30-Second EVM Cost Performance",
    painPoints: [
      "Cost and schedule overruns remain invisible until jobsite budgets are already exceeded.",
      "Unapproved Variation Orders (VOs) distort the running contract sum, creating disputes.",
      "Timesheet and jobsite progress data take days or weeks to reach project cost reports.",
    ],
    solutions: [
      "Up to 6-level Work Breakdown Structure (WBS) with automatic budget and cost roll-up.",
      "EVM metrics (CPI & SPI) recalculated within 30 seconds of jobsite timesheet approval.",
      "System-enforced contract ceilings ensuring progress claims never exceed certified contract values.",
    ],
  },
  procurement: {
    title: "For Procurement Managers & Buyers",
    roleName: "Procurement Manager",
    headline: "Threshold Approvals & Automated Vendor Scorecards",
    painPoints: [
      "Uncontrolled purchase requisitions and lack of threshold-based approval controls.",
      "Manual invoice verification against POs and Delivery Orders.",
      "Vendor performance and quality risks remain invisible until jobsite delivery failures occur.",
    ],
    solutions: [
      "Threshold-based PO approval routing (e.g. > RM 10,000 auto-routed for manager sign-off).",
      "Dynamic Vendor Scorecard evaluating On-Time Delivery (40%), Quality (40%), and Invoice Accuracy (20%).",
      "Automatic vendor tiering with score-based auto-downgrades from PREFERRED to SUSPENDED status.",
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const p = personaData[role];
  if (!p) return { title: "Solution | FolioDesk" };
  return {
    title: `${p.title} | FolioDesk`,
    description: p.headline,
  };
}

export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const p = personaData[role];
  if (!p) notFound();

  return (
    <section className="admin-wrap" style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
      <div className="admin-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div className="eyebrow">TAILORED SOLUTION · {p.roleName.toUpperCase()}</div>
          <h1>{p.headline}</h1>
          <p style={{ color: "#64748b", fontSize: 16, marginTop: 8 }}>{p.title}</p>
        </div>
        <Link href="/demo" className="button primary">Request a demo</Link>
      </div>

      {/* PAIN POINTS VS SOLUTIONS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
        <div className="admin-card" style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "#991b1b", marginBottom: 12 }}>The Challenges You Face Today</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#7f1d1d", fontSize: 14, lineHeight: 1.6 }}>
            {p.painPoints.map((item, i) => (
              <li key={i} style={{ marginBottom: 10 }}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="admin-card" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "#166534", marginBottom: 12 }}>How FolioDesk Solves It</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#14532d", fontSize: 14, lineHeight: 1.6 }}>
            {p.solutions.map((item, i) => (
              <li key={i} style={{ marginBottom: 10 }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ background: "#0f766e", color: "#fff", padding: 32, borderRadius: 8, textAlign: "center" }}>
        <h3 style={{ fontSize: 22, color: "#fff", marginBottom: 8 }}>See FolioDesk Configured for Your Team</h3>
        <p style={{ color: "#ccfbf1", fontSize: 15, maxWidth: 600, margin: "0 auto 20px" }}>
          Schedule a personalized demonstration tailored to your operational role.
        </p>
        <Link href="/demo" className="button pale">
          Book a Role-Tailored Demo
        </Link>
      </div>
    </section>
  );
}
