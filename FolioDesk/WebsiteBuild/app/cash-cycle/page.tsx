import Link from "next/link";

export const metadata = {
  title: "The Cash Cycle Model | FolioDesk",
  description: "Curing Autopsy Finance: Making the Cash Cycle a live, queryable data structure rather than a post-project reconstruction.",
};

export default function CashCyclePage() {
  return (
    <section className="admin-wrap" style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
      <div className="admin-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div className="eyebrow">THOUGHT LEADERSHIP & OPERATING MODEL</div>
          <h1>Curing Autopsy Finance in Engineering Firms</h1>
          <p style={{ color: "#64748b", fontSize: 16, marginTop: 8, maxWidth: 720 }}>
            Why winning more projects can break a growing contractor, and how to make cash movement a live, queryable data structure.
          </p>
        </div>
        <Link href="/demo" className="button primary">Request a demo</Link>
      </div>

      <div className="admin-card" style={{ background: "#f8fafc", padding: 24, borderRadius: 8, marginBottom: 32, borderLeft: "4px solid #0f766e" }}>
        <p style={{ fontSize: 18, fontStyle: "italic", color: "#1e293b", margin: 0, lineHeight: 1.6 }}>
          &ldquo;Every functional category in an engineering ERP exists to serve a single underlying business reality: the movement of Cash through the firm, out into committed obligations, and back again as collected revenue. Profitability is not something to be discovered at project closeout—it must be managed in real time during execution.&rdquo;
        </p>
      </div>

      <h2 style={{ fontSize: 24, marginBottom: 16, color: "#0f172a" }}>The Three Legs of the Cash Cycle</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>
        <div className="admin-card" style={{ padding: 24, borderRadius: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", letterSpacing: "1px" }}>LEG 1</span>
          <h3 style={{ fontSize: 20, marginTop: 4, marginBottom: 8 }}>Outbound Cash</h3>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
            Cash funds non-recoverable Overheads and, via the Purchase Cycle, funds Purchases through Creditors on strict credit terms. Uncontrolled POs at this stage create committed debt before field work begins.
          </p>
        </div>

        <div className="admin-card" style={{ padding: 24, borderRadius: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", letterSpacing: "1px" }}>LEG 2</span>
          <h3 style={{ fontSize: 20, marginTop: 4, marginBottom: 8 }}>Conversion & WIP</h3>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
            Purchases become Raw Materials ➔ consumed by WBS Projects ➔ converted through Work-in-Progress (WIP) into deliverable assets. Material scrap and unrecorded site labor at this stage create silent margin erosion.
          </p>
        </div>

        <div className="admin-card" style={{ padding: 24, borderRadius: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", letterSpacing: "1px" }}>LEG 3</span>
          <h3 style={{ fontSize: 20, marginTop: 4, marginBottom: 8 }}>Realisation & Collection</h3>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
            Finished project deliverables are certified via Interim Payment Certificates (IPC), creating Debtors. Payment collection returns cash to the firm, closing the cycle. Missing statutory clocks (CIPAA/SOP) delays this stage.
          </p>
        </div>
      </div>

      <div style={{ background: "#0f766e", color: "#fff", padding: 32, borderRadius: 8, textAlign: "center" }}>
        <h3 style={{ fontSize: 24, color: "#fff", marginBottom: 8 }}>Connect Field Activity to Financial Reality</h3>
        <p style={{ color: "#ccfbf1", fontSize: 16, maxWidth: 650, margin: "0 auto 24px" }}>
          See how FolioDesk turns your project cash cycle into a live operating picture.
        </p>
        <Link href="/demo" className="button pale">
          Schedule a Cash Cycle Demonstration
        </Link>
      </div>
    </section>
  );
}
