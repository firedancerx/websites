import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import ToggleTestModeButton from "../../../ToggleTestModeButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Affiliate Detail & Review | Admin", robots: { index: false, follow: false } };

export default async function RequestCorrectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const { id } = await params;
  const q = await searchParams;

  const [rows] = await db().execute<any[]>(
    "SELECT a.*, u.email, u.full_name FROM affiliate_applications a JOIN users u ON u.id=a.user_id WHERE a.id=? LIMIT 1",
    [id]
  );

  const a = rows[0];
  if (!a) redirect("/admin");

  // 1. Query Active Prospects (Sales funnel pipeline in progress)
  const [prospects] = await db().execute<any[]>(
    `SELECT d.*, 
       COALESCE((SELECT SUM(collected_amount_myr) FROM deal_collections WHERE deal_id = d.id AND approval_status = 'APPROVED'), 0) as total_collected_myr
     FROM deal_pipeline d 
     WHERE d.affiliate_id = ?
       AND d.status NOT IN ('FULLY_COLLECTED', 'ABORTED', 'UNCOLLECTIBLE')
     ORDER BY d.created_at DESC`,
    [a.id]
  );

  const [clientDeals] = await db().execute<any[]>(
    `SELECT d.*, 
       COALESCE((SELECT SUM(collected_amount_myr) FROM deal_collections WHERE deal_id = d.id AND approval_status = 'APPROVED'), 0) as total_collected_myr
     FROM deal_pipeline d 
     WHERE d.affiliate_id = ?
       AND d.status = 'FULLY_COLLECTED'
     ORDER BY d.updated_at DESC`,
    [a.id]
  );

  const [onboardedCusts] = await db().execute<any[]>(
    "SELECT * FROM onboarded_customers WHERE affiliate_id=? ORDER BY signed_date DESC",
    [a.id]
  );

  const activeClientsMap = new Map<string, any>();
  clientDeals.forEach((d) => {
    const key = (d.customer_name || "").trim().toLowerCase();
    activeClientsMap.set(key, {
      id: d.id,
      deal_id: d.id,
      deal_code: d.deal_code,
      customer_name: d.customer_name,
      customer_email: d.customer_email,
      customer_phone: d.customer_phone,
      package_name: d.package_name,
      package_count: d.package_count || 1,
      annual_value_myr: d.contract_value_myr,
      total_collected_myr: d.total_collected_myr,
      invoice_number: d.invoice_number,
      signed_date: d.signed_date || d.created_at,
      status: d.status,
      is_test: d.is_test,
    });
  });

  onboardedCusts.forEach((c) => {
    const key = (c.customer_name || "").trim().toLowerCase();
    if (!activeClientsMap.has(key)) {
      activeClientsMap.set(key, {
        id: c.id,
        deal_id: null,
        deal_code: null,
        customer_name: c.customer_name,
        customer_email: c.customer_email,
        customer_phone: c.customer_phone,
        package_name: c.package_name,
        package_count: c.package_count || 1,
        annual_value_myr: c.annual_value_myr,
        total_collected_myr: c.annual_value_myr,
        invoice_number: null,
        signed_date: c.signed_date || c.created_at,
        status: c.status || "ACTIVE",
        is_test: 0,
      });
    }
  });

  const activeClients = Array.from(activeClientsMap.values());

  // Query latest profile update request

  // Query latest profile update request
  const [updateRows] = await db().execute<any[]>(
    "SELECT * FROM affiliate_profile_updates WHERE application_id=? ORDER BY created_at DESC LIMIT 1",
    [id]
  );
  const pendingUpdate = updateRows[0] && updateRows[0].status === "PENDING_APPROVAL" ? updateRows[0] : null;

  return (
    <section className="admin-wrap">
      <div className="admin-head">
        <div>
          <div className="eyebrow">ADMIN APPLICATION & AFFILIATE PROFILE</div>
          <h1>{a.legal_name} ({a.application_number})</h1>
        </div>
        <Link className="button secondary" href="/admin">← Back to Applications</Link>
      </div>

      {/* DATA MODE CONTROL BANNER */}
      <div
        style={{
          background: a.is_test === 1 ? "#fffbeb" : "#f0fdf4",
          border: `1.5px solid ${a.is_test === 1 ? "#fde68a" : "#bbf7d0"}`,
          borderRadius: 10,
          padding: "12px 18px",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <strong style={{ color: a.is_test === 1 ? "#b45309" : "#166534", fontSize: 14 }}>
            {a.is_test === 1 ? "🧪 CURRENT DATA MODE: TESTER DATA" : "💼 CURRENT DATA MODE: ACTUAL PRODUCTION DATA"}
          </strong>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
            {a.is_test === 1
              ? "This affiliate profile is marked as test data. Switch to Actual Production Data when transitioning to live environment."
              : "This affiliate profile is marked as active production data."}
          </p>
        </div>
        <ToggleTestModeButton entityType="affiliate" entityId={a.id} isTest={a.is_test} size="md" />
      </div>

      {q.success && (
        <p className="notice" style={{ background: "rgba(16,185,129,0.1)", borderColor: "#10b981", color: "#065f46", marginBottom: 20 }}>
          ✓ {q.success}
        </p>
      )}
      {q.error && <p className="notice error" style={{ marginBottom: 20 }}>⚠️ {q.error}</p>}

      {/* PENDING eKYC PROFILE UPDATE REVIEW CARD */}
      {pendingUpdate && (
        <div
          className="admin-card"
          style={{
            background: "#eff6ff",
            border: "2px solid #2563eb",
            borderRadius: 12,
            marginBottom: 24,
            padding: 24,
            boxShadow: "0 6px 18px rgba(37, 99, 235, 0.12)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <span className="badge" style={{ background: "#2563eb", color: "#ffffff", fontWeight: 700, padding: "4px 12px", fontSize: 12 }}>
                ⏳ ACTION REQUIRED: PENDING eKYC PROFILE UPDATE
              </span>
              <h2 style={{ fontSize: 22, marginTop: 8, color: "#1e3a8a" }}>
                Affiliate Profile Update Request #{pendingUpdate.id}
              </h2>
              <p style={{ color: "#1d4ed8", fontSize: 13, margin: "2px 0 0 0" }}>
                Submitted on {new Date(pendingUpdate.created_at).toLocaleDateString("en-MY", { dateStyle: "long", timeStyle: "short" })}
              </p>
            </div>
          </div>

          <p style={{ fontSize: 14, color: "#1e40af", marginBottom: 16 }}>
            The affiliate has requested profile modifications below. Review the proposed changes against active live profile values before approving or rejecting.
          </p>

          {/* FIELD-BY-FIELD DIFF TABLE */}
          <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: 8, border: "1.5px solid #bfdbfe", marginBottom: 20 }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#dbeafe", textAlign: "left", color: "#1e40af" }}>
                  <th style={{ padding: "10px 14px", width: "25%" }}>Field</th>
                  <th style={{ padding: "10px 14px", width: "37.5%" }}>Active Live Profile</th>
                  <th style={{ padding: "10px 14px", width: "37.5%" }}>Proposed Update (Pending eKYC)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Account Full Name", active: a.full_name, proposed: pendingUpdate.full_name },
                  { label: "Legal Name", active: a.legal_name, proposed: pendingUpdate.legal_name },
                  { label: "Applicant Type", active: a.applicant_type, proposed: pendingUpdate.applicant_type },
                  { label: "ID / Reg Number", active: a.company_number || "N/A", proposed: pendingUpdate.company_number || "N/A" },
                  { label: "Telephone Phone", active: a.phone, proposed: pendingUpdate.phone },
                  { label: "Address Line 1", active: a.address_line1 || "N/A", proposed: pendingUpdate.address_line1 || "N/A" },
                  { label: "Address Line 2", active: a.address_line2 || "N/A", proposed: pendingUpdate.address_line2 || "N/A" },
                  { label: "Address Line 3", active: a.address_line3 || "N/A", proposed: pendingUpdate.address_line3 || "N/A" },
                  { label: "Postcode", active: a.postcode || "N/A", proposed: pendingUpdate.postcode || "N/A" },
                  { label: "Town / City", active: a.town || "N/A", proposed: pendingUpdate.town || "N/A" },
                  { label: "State / Region", active: a.state || "N/A", proposed: pendingUpdate.state || "N/A" },
                  { label: "Country & Currency", active: `${a.country_code} (${a.currency})`, proposed: `${pendingUpdate.country_code} (${pendingUpdate.currency})` },
                  { label: "Market Focus", active: a.market_focus, proposed: pendingUpdate.market_focus },
                  { label: "Website URL", active: a.website_url || "N/A", proposed: pendingUpdate.website_url || "N/A" },
                  { label: "Social Media URL", active: a.social_url || "N/A", proposed: pendingUpdate.social_url || "N/A" },
                  { label: "Target Audience", active: a.audience_description, proposed: pendingUpdate.audience_description },
                  { label: "Promotion Method", active: a.promotion_method, proposed: pendingUpdate.promotion_method },
                ].map((row, idx) => {
                  const isChanged = String(row.active).trim() !== String(row.proposed).trim();
                  return (
                    <tr
                      key={idx}
                      style={{
                        background: isChanged ? "#eff6ff" : idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <td style={{ padding: "10px 14px", fontWeight: isChanged ? 700 : 500, color: isChanged ? "#1d4ed8" : "#475569" }}>
                        {row.label} {isChanged && <span style={{ color: "#2563eb", fontSize: 11 }}>● CHANGED</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: isChanged ? "#64748b" : "#334155", textDecoration: isChanged ? "line-through" : "none" }}>
                        {row.active}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: isChanged ? 700 : 400, color: isChanged ? "#1e40af" : "#334155" }}>
                        {row.proposed}
                      </td>
                    </tr>
                  );
                })}

                {/* ID DOCUMENTS DIFF */}
                <tr style={{ background: a.id_doc_path !== pendingUpdate.id_doc_path ? "#eff6ff" : "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#475569" }}>Picture of ID Document</td>
                  <td style={{ padding: "10px 14px" }}>
                    {a.id_doc_path ? <a href={a.id_doc_path} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>📄 Active ID Doc</a> : "Not uploaded"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {pendingUpdate.id_doc_path ? <a href={pendingUpdate.id_doc_path} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 700 }}>📄 Proposed ID Doc</a> : "Not uploaded"}
                  </td>
                </tr>

                <tr style={{ background: a.holding_id_path !== pendingUpdate.holding_id_path ? "#eff6ff" : "#f8fafc" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#475569" }}>Photo Holding ID Document</td>
                  <td style={{ padding: "10px 14px" }}>
                    {a.holding_id_path ? <a href={a.holding_id_path} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>📷 Active Photo Holding ID</a> : "Not uploaded"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {pendingUpdate.holding_id_path ? <a href={pendingUpdate.holding_id_path} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 700 }}>📷 Proposed Photo Holding ID</a> : "Not uploaded"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ADMIN ACTION FORM */}
          <form action={`/foliodesk/api/admin/profile-updates/${pendingUpdate.id}`} method="post" style={{ background: "#ffffff", padding: 18, borderRadius: 8, border: "1px solid #bfdbfe" }}>
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="adminRemarks" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginBottom: 6 }}>
                Admin Remarks / Feedback Notes (Optional for Approval, Required/Recommended for Rejection):
              </label>
              <textarea
                id="adminRemarks"
                name="adminRemarks"
                rows={3}
                placeholder="Enter remarks for the affiliate regarding this profile update..."
                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="submit"
                name="action"
                value="APPROVE"
                className="button primary"
                style={{ background: "#16a34a", borderColor: "#15803d", padding: "10px 20px", fontWeight: 700 }}
              >
                ✓ Approve Profile Update & Apply to Live Profile
              </button>

              <button
                type="submit"
                name="action"
                value="REJECT"
                className="button secondary"
                style={{ background: "#dc2626", borderColor: "#b91c1c", color: "#ffffff", padding: "10px 20px", fontWeight: 700 }}
              >
                ✕ Reject Profile Update
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
        {/* UNEDITABLE APPLICANT DETAILS PREVIEW */}
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e2e8f0" }}>
            <div>
              <span
                className="badge"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    a.status === "SUBMITTED"
                      ? "#dbeafe"
                      : a.status === "UNDER_REVIEW"
                      ? "#e0e7ff"
                      : a.status === "CORRECTION_REQUIRED" || a.status === "INFORMATION_REQUIRED"
                      ? "#fef3c7"
                      : a.status === "APPROVED"
                      ? "#dcfce7"
                      : a.status === "SUSPENDED"
                      ? "#ffedd5"
                      : a.status === "REJECTED"
                      ? "#ffe4e6"
                      : a.status === "RETRACTED"
                      ? "#fee2e2"
                      : a.status === "RETRACTION_ACKNOWLEDGED"
                      ? "#f1f5f9"
                      : undefined,
                  color:
                    a.status === "SUBMITTED"
                      ? "#1e40af"
                      : a.status === "UNDER_REVIEW"
                      ? "#3730a3"
                      : a.status === "CORRECTION_REQUIRED" || a.status === "INFORMATION_REQUIRED"
                      ? "#92400e"
                      : a.status === "APPROVED"
                      ? "#166534"
                      : a.status === "SUSPENDED"
                      ? "#c2410c"
                      : a.status === "REJECTED"
                      ? "#9f1239"
                      : a.status === "RETRACTED"
                      ? "#991b1b"
                      : a.status === "RETRACTION_ACKNOWLEDGED"
                      ? "#475569"
                      : undefined,
                  border:
                    a.status === "SUBMITTED"
                      ? "1px solid #bfdbfe"
                      : a.status === "UNDER_REVIEW"
                      ? "1px solid #c7d2fe"
                      : a.status === "CORRECTION_REQUIRED" || a.status === "INFORMATION_REQUIRED"
                      ? "1px solid #fde68a"
                      : a.status === "APPROVED"
                      ? "1px solid #bbf7d0"
                      : a.status === "SUSPENDED"
                      ? "1px solid #fed7aa"
                      : a.status === "REJECTED"
                      ? "1px solid #fecdd3"
                      : a.status === "RETRACTED"
                      ? "1px solid #fca5a5"
                      : a.status === "RETRACTION_ACKNOWLEDGED"
                      ? "1px solid #cbd5e1"
                      : undefined,
                }}
              >
                {a.status.replaceAll("_", " ")}
              </span>
              <h2 style={{ fontSize: 24, marginTop: 4 }}>{a.legal_name}</h2>
              <p style={{ color: "#64748b", fontSize: 14 }}>{a.email} · {a.phone}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <small style={{ color: "#64748b" }}>Submitted</small>
              <p style={{ fontWeight: 600 }}>{new Date(a.submitted_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}</p>
            </div>
          </div>

          <h3 style={{ fontSize: 18, marginBottom: 12, color: "#1e293b" }}>Applicant Information (Read-Only)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div><small style={{ color: "#64748b" }}>Full Name</small><p style={{ fontWeight: 500 }}>{a.full_name}</p></div>
            <div><small style={{ color: "#64748b" }}>Applicant Type</small><p style={{ fontWeight: 500 }}>{a.applicant_type}</p></div>
            <div><small style={{ color: "#64748b" }}>{a.applicant_type === "INDIVIDUAL" ? "Personal ID / NRIC No." : "Company Reg. No."}</small><p style={{ fontWeight: 500 }}>{a.company_number || "N/A"}</p></div>
            <div><small style={{ color: "#64748b" }}>9-Char Affiliate ID</small><p style={{ fontWeight: 700, color: "#0f766e" }}>{a.affiliate_code || "N/A"}</p></div>
            <div><small style={{ color: "#64748b" }}>Upline Referral Code</small><p style={{ fontWeight: 600 }}>{a.upline_affiliate_code || "None"}</p></div>
            <div><small style={{ color: "#64748b" }}>Market Focus</small><p style={{ fontWeight: 500 }}>{a.market_focus}</p></div>
            <div><small style={{ color: "#64748b" }}>Website URL</small><p style={{ fontWeight: 500 }}>{a.website_url ? <a href={a.website_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>{a.website_url}</a> : "N/A"}</p></div>
            <div><small style={{ color: "#64748b" }}>Social Media URL</small><p style={{ fontWeight: 500 }}>{a.social_url ? <a href={a.social_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>{a.social_url}</a> : "N/A"}</p></div>
          </div>

          <h3 style={{ fontSize: 18, marginBottom: 12, color: "#1e293b" }}>Promotional & Audience Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div><small style={{ color: "#64748b" }}>Target Audience Description</small><p style={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>{a.audience_description || "N/A"}</p></div>
            <div><small style={{ color: "#64748b" }}>Promotion Methods</small><p style={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>{a.promotion_method || "N/A"}</p></div>
          </div>

          <h3 style={{ fontSize: 18, marginBottom: 12, color: "#1e293b" }}>Address & Location</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div><small style={{ color: "#64748b" }}>Address Line 1</small><p style={{ fontWeight: 500 }}>{a.address_line1 || "N/A"}</p></div>
            <div><small style={{ color: "#64748b" }}>Address Line 2</small><p style={{ fontWeight: 500 }}>{a.address_line2 || "N/A"}</p></div>
            <div><small style={{ color: "#64748b" }}>Address Line 3</small><p style={{ fontWeight: 500 }}>{a.address_line3 || "N/A"}</p></div>
            <div><small style={{ color: "#64748b" }}>Postcode</small><p style={{ fontWeight: 500 }}>{a.postcode || "N/A"}</p></div>
            <div><small style={{ color: "#64748b" }}>Town / City</small><p style={{ fontWeight: 500 }}>{a.town || "N/A"}</p></div>
            <div><small style={{ color: "#64748b" }}>State / Region</small><p style={{ fontWeight: 500 }}>{a.state || "N/A"}</p></div>
            <div><small style={{ color: "#64748b" }}>Country</small><p style={{ fontWeight: 500 }}>{a.country_code}</p></div>
            <div><small style={{ color: "#64748b" }}>Currency</small><p style={{ fontWeight: 500 }}>{a.currency}</p></div>
          </div>

          <h3 style={{ fontSize: 18, marginBottom: 12, color: "#1e293b" }}>Uploaded Documents</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <small style={{ color: "#64748b" }}>1. Picture of ID Document</small>
              <p style={{ marginTop: 4 }}>
                {a.id_doc_path ? (
                  <a href={a.id_doc_path} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "#2563eb" }}>
                    📄 View ID Document
                  </a>
                ) : (
                  "Not uploaded"
                )}
              </p>
            </div>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <small style={{ color: "#64748b" }}>2. Photo Holding ID Document</small>
              <p style={{ marginTop: 4 }}>
                {a.holding_id_path ? (
                  <a href={a.holding_id_path} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "#2563eb" }}>
                    📷 View Photo Holding ID
                  </a>
                ) : (
                  "Not uploaded"
                )}
              </p>
            </div>
          </div>

          {/* SECTION 1: ACTIVE PROSPECTS (SALES FUNNEL IN PROGRESS) */}
          <div id="active-prospects" style={{ paddingTop: 20, marginTop: 24, borderTop: "2px dashed #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, margin: 0, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🎯 Active Prospects Pipeline</span>
                </h3>
                <small style={{ color: "#64748b" }}>In-progress sales deals with live funnel stage tracking</small>
              </div>
              <span className="badge" style={{ background: prospects.length ? "#fef3c7" : "#f1f5f9", color: prospects.length ? "#b45309" : "#64748b", fontWeight: 700, border: prospects.length ? "1px solid #fde68a" : "1px solid #cbd5e1" }}>
                {prospects.length} Active Prospect{prospects.length === 1 ? "" : "s"}
              </span>
            </div>

            {prospects.length ? (
              <div style={{ overflowX: "auto", border: "1px solid #fde68a", borderRadius: 8, background: "#fffdf5" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#fef3c7", textAlign: "left", color: "#92400e", borderBottom: "1px solid #fde68a" }}>
                      <th style={{ padding: "10px 12px" }}>Prospect Name & Contact</th>
                      <th style={{ padding: "10px 12px" }}>Current Funnel Progress Stage</th>
                      <th style={{ padding: "10px 12px" }}>Package / Offer</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Contract Value</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Collected</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospects.map((p) => {
                      const stageLabel =
                        p.status === "LEAD_SUBMITTED"
                          ? "1. Lead Submitted"
                          : p.status === "QUALIFIED"
                          ? "2. Qualified Lead"
                          : p.status === "PROPOSAL_SENT"
                          ? "3. Proposal Sent"
                          : p.status === "CONTRACT_SIGNED"
                          ? "4. Contract Signed"
                          : p.status === "INVOICED"
                          ? "5. Invoiced"
                          : p.status === "PARTIAL_COLLECTED"
                          ? "6. Partially Collected"
                          : p.status === "SUSPENDED_EFFORT"
                          ? "⏸️ Effort Suspended"
                          : p.status.replaceAll("_", " ");

                      const stageBg =
                        p.status === "LEAD_SUBMITTED"
                          ? "#dbeafe"
                          : p.status === "QUALIFIED"
                          ? "#e0e7ff"
                          : p.status === "PROPOSAL_SENT"
                          ? "#f3e8ff"
                          : p.status === "CONTRACT_SIGNED"
                          ? "#dcfce7"
                          : p.status === "INVOICED"
                          ? "#ffedd5"
                          : p.status === "PARTIAL_COLLECTED"
                          ? "#ccfbf1"
                          : "#fee2e2";

                      const stageColor =
                        p.status === "LEAD_SUBMITTED"
                          ? "#1e40af"
                          : p.status === "QUALIFIED"
                          ? "#3730a3"
                          : p.status === "PROPOSAL_SENT"
                          ? "#6b21a8"
                          : p.status === "CONTRACT_SIGNED"
                          ? "#166534"
                          : p.status === "INVOICED"
                          ? "#c2410c"
                          : p.status === "PARTIAL_COLLECTED"
                          ? "#0f766e"
                          : "#991b1b";

                      return (
                        <tr key={p.id} style={{ borderBottom: "1px solid #fef3c7" }}>
                          <td style={{ padding: "10px 12px" }}>
                            <b style={{ color: "#0f172a" }}>{p.customer_name}</b>
                            <br />
                            <small style={{ color: "#64748b" }}>{p.customer_email} {p.customer_phone ? `· ${p.customer_phone}` : ""}</small>
                            {p.deal_code && <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 700 }}>Code: {p.deal_code}</div>}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span
                              className="badge"
                              style={{
                                background: stageBg,
                                color: stageColor,
                                fontWeight: 700,
                                fontSize: 11,
                                padding: "3px 8px",
                                borderRadius: 6,
                              }}
                            >
                              {stageLabel}
                            </span>
                            {p.is_test === 1 && (
                              <span style={{ marginLeft: 6, fontSize: 10, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "2px 5px", borderRadius: 4, fontWeight: 700 }}>
                                🧪 TEST
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ fontWeight: 600, color: "#0f766e" }}>{p.package_name}</span>
                            {p.package_count > 1 && <span style={{ fontSize: 11, color: "#475569" }}> (x{p.package_count})</span>}
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1e293b", textAlign: "right" }}>
                            RM {Number(p.contract_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: Number(p.total_collected_myr) > 0 ? "#166534" : "#64748b", textAlign: "right" }}>
                            RM {Number(p.total_collected_myr || 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <Link
                              href={`/admin/deals/${p.id}`}
                              className="button secondary"
                              style={{ fontSize: 11, padding: "4px 8px", whiteSpace: "nowrap", color: "#0f766e", borderColor: "#0f766e" }}
                            >
                              🗺️ View Deal
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ background: "#fffdf5", padding: 18, borderRadius: 6, color: "#92400e", fontSize: 14, textAlign: "center", border: "1px dashed #fde68a" }}>
                No active prospects in sales funnel yet.
              </div>
            )}
          </div>

          {/* SECTION 2: ACTIVE CLIENTS (CLOSED-WON & ONBOARDED) */}
          <div id="active-clients" style={{ paddingTop: 20, marginTop: 24, borderTop: "2px dashed #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, margin: 0, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>💼 Active Clients</span>
                </h3>
                <small style={{ color: "#64748b" }}>Converted clients with signed contracts & full collections</small>
              </div>
              <span className="badge" style={{ background: activeClients.length ? "#dcfce7" : "#f1f5f9", color: activeClients.length ? "#166534" : "#64748b", fontWeight: 700, border: activeClients.length ? "1px solid #bbf7d0" : "1px solid #cbd5e1" }}>
                {activeClients.length} Active Client{activeClients.length === 1 ? "" : "s"}
              </span>
            </div>

            {activeClients.length ? (
              <div style={{ overflowX: "auto", border: "1px solid #bbf7d0", borderRadius: 8, background: "#f0fdf4" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#dcfce7", textAlign: "left", color: "#166534", borderBottom: "1px solid #bbf7d0" }}>
                      <th style={{ padding: "10px 12px" }}>Client Name & Contact</th>
                      <th style={{ padding: "10px 12px" }}>Signed Date</th>
                      <th style={{ padding: "10px 12px" }}>Signed Package / Product</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Contract Value</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Collected</th>
                      <th style={{ padding: "10px 12px" }}>Status / Ref</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeClients.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #dcfce7" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <b style={{ color: "#0f172a" }}>{c.customer_name}</b>
                          <br />
                          <small style={{ color: "#64748b" }}>{c.customer_email} {c.customer_phone ? `· ${c.customer_phone}` : ""}</small>
                        </td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "#334155" }}>
                          {c.signed_date ? new Date(c.signed_date).toLocaleDateString("en-MY", { dateStyle: "medium" }) : "-"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ fontWeight: 600, color: "#0f766e" }}>{c.package_name}</span>
                          {c.package_count > 1 && <span style={{ fontSize: 11, color: "#475569" }}> (x{c.package_count})</span>}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1e293b", textAlign: "right" }}>
                          RM {Number(c.annual_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#15803d", textAlign: "right" }}>
                          RM {Number(c.total_collected_myr || c.annual_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className="badge" style={{ background: "#dcfce7", color: "#166534", fontWeight: 700, border: "1px solid #bbf7d0" }}>
                            {c.status.replaceAll("_", " ")}
                          </span>
                          {c.is_test === 1 && (
                            <span style={{ marginLeft: 6, fontSize: 10, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "2px 5px", borderRadius: 4, fontWeight: 700 }}>
                              🧪 TEST
                            </span>
                          )}
                          {c.invoice_number && <div style={{ fontSize: 11, color: "#6b21a8", fontWeight: 700, marginTop: 2 }}>Inv: {c.invoice_number}</div>}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {c.deal_id ? (
                            <Link
                              href={`/admin/deals/${c.deal_id}`}
                              className="button secondary"
                              style={{ fontSize: 11, padding: "4px 8px", whiteSpace: "nowrap", color: "#0f766e", borderColor: "#0f766e" }}
                            >
                              🗺️ View Deal
                            </Link>
                          ) : (
                            <span style={{ fontSize: 11, color: "#64748b" }}>Onboarded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ background: "#f0fdf4", padding: 18, borderRadius: 6, color: "#166534", fontSize: 14, textAlign: "center", border: "1px dashed #bbf7d0" }}>
                No active onboarded clients yet.
              </div>
            )}
          </div>
        </div>

        {/* FEEDBACK & CORRECTION FORM / STATUS ACTIONS */}
        <div className="admin-card" style={{ background: "#fff", border: a.status === "RETRACTED" ? "2px solid #ef4444" : "2px solid #f59e0b" }}>
          <h3 style={{ fontSize: 20, marginBottom: 6, color: a.status === "RETRACTED" ? "#991b1b" : "#b45309" }}>
            {a.status === "RETRACTED" ? "Affiliateship Retraction Review" : "Correction Feedback & Decision"}
          </h3>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
            {a.status === "RETRACTED"
              ? "This partner has retracted their affiliateship. As superadmin, you may acknowledge this retraction. Profile remains read-only and historical commission rights are preserved."
              : "Select feedback items and provide remarks for the applicant. These will be shown on their profile."}
          </p>

          <form action={`/foliodesk/api/admin/applications/${a.id}`} method="post">
            {a.status !== "RETRACTED" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" name="idDocUnclear" value="1" defaultChecked={Boolean(a.flag_id_doc_unclear)} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>ID document not clear</span>
                </label>

                <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" name="holdingIdUnaccepted" value="1" defaultChecked={Boolean(a.flag_holding_id_unaccepted)} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Photo holding ID unaccepted</span>
                </label>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="remarks" style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                Remarks / Admin Notes
              </label>
              <textarea
                id="remarks"
                name="remarks"
                rows={5}
                defaultValue={a.decision_note || ""}
                placeholder="Enter instructions, notes, or acknowledgment remarks..."
                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {a.status === "RETRACTED" ? (
                <button
                  type="submit"
                  name="decision"
                  value="RETRACTION_ACKNOWLEDGED"
                  className="button primary"
                  style={{ width: "100%", justifyContent: "center", background: "#475569", borderColor: "#334155" }}
                >
                  Acknowledge Retraction
                </button>
              ) : (
                <button
                  type="submit"
                  name="decision"
                  value="CORRECTION_REQUIRED"
                  className="button primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Submit request
                </button>
              )}

              <Link className="button secondary" href="/admin" style={{ width: "100%", textAlign: "center", boxSizing: "border-box" }}>
                Back to Applications
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
