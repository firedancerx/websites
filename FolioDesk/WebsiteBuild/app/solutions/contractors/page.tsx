import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Engineering Contractor Solutions | FolioDesk",
  description: "CIDB & BCA compliance, statutory payment clocks (CIPAA / SOP Act), retention ledgers, and variation order control for contractors.",
};

const problems = [
  {
    title: "Variation Orders (VO) Untracked",
    text: "Up to 15–40% of contract value is typically tied up in variation orders. Without real-time tracking, the 'running contract sum' becomes meaningless.",
    solution: "Automated VO approval workflows that instantly update WBS budget roll-ups and enforce claim ceilings.",
    image: "/foliodesk/assets/images/solutions/problems/SolutionsPage_Sec02_Problem01_VO_RunningContractSum_Micro.png",
  },
  {
    title: "Statutory Payment Clocks",
    text: "Missing statutory certification deadlines under CIPAA (30 days in Malaysia) or SOP Act (35 days in Singapore) forfeits statutory adjudication rights.",
    solution: "Automated countdown clocks tracking certification dates and statutory payment due dates.",
    image: "/foliodesk/assets/images/solutions/problems/SolutionsPage_Sec02_Problem02_CIPAA_SOP_PaymentClock_Micro.png",
  },
  {
    title: "Invisible Retention Money",
    text: "5–10% of contract value is held back across Defects Liability Periods (DLP) with no dedicated ledger in standard accounting platforms.",
    solution: "Native Retention Money Ledger tracking release tranches and DLP expiry dates per project.",
    image: "/foliodesk/assets/images/solutions/problems/SolutionsPage_Sec02_Problem03_Retention_2TrancheLedger_Micro.png",
  },
  {
    title: "Performance Bond Expiry Trap",
    text: "Lapsing a performance bond before practical completion puts the contractor in immediate breach and erodes bank credit lines.",
    solution: "Automated bond renewal alerts and aggregate bank guarantee exposure monitoring.",
    image: "/foliodesk/assets/images/solutions/problems/SolutionsPage_Sec02_Problem04_PerformanceBond_ExpiryAlert_Micro.png",
  },
  {
    title: "Unallocated Foreign Worker Levies",
    text: "SGD 300–900 / RM 150–500 monthly levies are rarely allocated to specific projects, severely distorting true project profitability.",
    solution: "Direct allocation of worker levies and overheads to project P&Ls based on timesheet hours.",
    image: "/foliodesk/assets/images/solutions/problems/SolutionsPage_Sec02_Problem05_ForeignWorkerLevy_Allocation_Micro.png",
  },
  {
    title: "Curing Evaporating Inventory",
    text: "Unmonitored material scrap, site loss, and inventory shrinkage silently bleed project cash margins.",
    solution: "Jobsite material issue tracking with dual FIFO and Weighted Average costing methods.",
    image: "/foliodesk/assets/images/solutions/problems/SolutionsPage_Sec02_Problem06_MaterialScrap_DualCosting_Micro.png",
  },
];

export default function ContractorSolutionsPage() {
  return (
    <section className="admin-wrap" style={{ maxWidth: 1160, margin: "0 auto", padding: "40px 20px" }}>
      {/* 01. HERO SECTION */}
      <div className="admin-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div className="eyebrow">REGULATORY & INDUSTRY SOLUTIONS</div>
          <h1>Built for CIDB (MY) & BCA (SG) Contractors</h1>
          <p style={{ color: "#64748b", fontSize: 16, marginTop: 8, maxWidth: 720 }}>
            Generic accounting software ignores regional construction laws and statutory compliance. FolioDesk is built around the strict regulatory realities of engineering contractors in Malaysia and Singapore.
          </p>
        </div>
        <Link href="/demo" className="button primary">Request a demo</Link>
      </div>

      {/* REGIONAL COMPLIANCE MATRIX HERO GRAPHIC */}
      <div style={{ maxWidth: "100%", marginBottom: 44, borderRadius: 16, overflow: "hidden", background: "#0b0f17", border: "1px solid #1e293b", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
        <Image
          src="/foliodesk/assets/images/solutions/hero/SolutionsPage_Sec01_Hero_RegionalCompliance_Matrix.png"
          alt="Dual-Panel CIDB Malaysia vs BCA Singapore Statutory Command Matrix"
          width={1200}
          height={600}
          style={{ width: "100%", height: "auto", display: "block" }}
          priority
        />
      </div>

      {/* 02. SIX PROBLEM & SOLUTION CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 28, marginBottom: 48 }}>
        {problems.map((p, idx) => (
          <div key={idx} className="admin-card" style={{ padding: 24, borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              {/* MICRO SCHEMATIC HEADER */}
              <div style={{ width: "100%", height: 130, marginBottom: 18, borderRadius: 10, overflow: "hidden", background: "#0b0f17", border: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Image
                  src={p.image}
                  alt={p.title}
                  width={240}
                  height={120}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>

              <h3 style={{ fontSize: 19, color: "#0f172a", marginTop: 0, marginBottom: 8 }}>{p.title}</h3>
              <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{p.text}</p>
            </div>

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 12, borderRadius: 8, fontSize: 13, color: "#166534" }}>
              <b>FolioDesk Solution:</b> {p.solution}
            </div>
          </div>
        ))}
      </div>

      {/* 03. BOTTOM COMPLIANCE GUARANTEE CTA */}
      <div style={{ background: "#0f766e", color: "#fff", padding: 40, borderRadius: 16, textAlign: "center", boxShadow: "0 10px 30px rgba(15,118,110,0.2)" }}>
        <div style={{ maxWidth: 300, margin: "0 auto 16px" }}>
          <Image
            src="/foliodesk/assets/images/solutions/cta/SolutionsPage_Sec03_CTA_ComplianceGuarantee_Badge.png"
            alt="CIDB Malaysia & BCA Singapore Compliance Guarantee Badge"
            width={300}
            height={64}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
        <h3 style={{ fontSize: 26, color: "#fff", marginBottom: 8 }}>Protect Your Contract Margins & Compliance Rights</h3>
        <p style={{ color: "#ccfbf1", fontSize: 16, maxWidth: 650, margin: "0 auto 24px" }}>
          See how FolioDesk brings statutory protection and full financial control to your engineering projects.
        </p>
        <Link href="/demo" className="button pale">
          Talk to a Construction Specialist
        </Link>
      </div>
    </section>
  );
}
