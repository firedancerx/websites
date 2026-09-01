import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Affiliate Detail & Review | Admin", robots: { index: false, follow: false } };

export default async function RequestCorrectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const { id } = await params;
  const [rows] = await db().execute<any[]>(
    "SELECT a.*, u.email, u.full_name FROM affiliate_applications a JOIN users u ON u.id=a.user_id WHERE a.id=? LIMIT 1",
    [id]
  );

  const a = rows[0];
  if (!a) redirect("/admin");

  // Query directly onboarded customers for this affiliate
  const [customers] = await db().execute<any[]>(
    "SELECT * FROM onboarded_customers WHERE affiliate_id=? ORDER BY signed_date DESC",
    [id]
  );

  return (
    <section className="admin-wrap">
      <div className="admin-head">
        <div>
          <div className="eyebrow">ADMIN APPLICATION & AFFILIATE PROFILE</div>
          <h1>{a.legal_name} ({a.application_number})</h1>
        </div>
        <Link className="button secondary" href="/admin">← Back to Applications</Link>
      </div>

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

          {/* ONBOARDED CUSTOMERS & SIGNED SALES OFFERS SECTION */}
          <div style={{ paddingTop: 20, borderTop: "2px dashed #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 18, margin: 0, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                <span>👥 Directly Onboarded Customers</span>
              </h3>
              <span className="badge" style={{ background: customers.length ? "#dbeafe" : "#f1f5f9", color: customers.length ? "#1e40af" : "#64748b", fontWeight: 700 }}>
                {customers.length} Customer{customers.length === 1 ? "" : "s"} Onboarded
              </span>
            </div>

            {customers.length ? (
              <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #cbd5e1" }}>
                      <th style={{ padding: "10px 12px" }}>Customer Name</th>
                      <th style={{ padding: "10px 12px" }}>Signed Date</th>
                      <th style={{ padding: "10px 12px" }}>Signed Sales Offer / Package</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Packages</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Annual Value</th>
                      <th style={{ padding: "10px 12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #edf2f7" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <b style={{ color: "#0f172a" }}>{c.customer_name}</b>
                          <br />
                          <small style={{ color: "#64748b" }}>{c.customer_email} {c.customer_phone ? `· ${c.customer_phone}` : ""}</small>
                        </td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "#334155" }}>
                          {new Date(c.signed_date).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ fontWeight: 600, color: "#0f766e" }}>{c.package_name}</span>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, textAlign: "center" }}>
                          {c.package_count}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1e293b", textAlign: "right" }}>
                          RM {Number(c.annual_value_myr).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className="badge" style={{ background: c.status === "ACTIVE" ? "#dcfce7" : "#fef3c7", color: c.status === "ACTIVE" ? "#166534" : "#92400e" }}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ background: "#f8fafc", padding: 18, borderRadius: 6, color: "#64748b", fontSize: 14, textAlign: "center", border: "1px dashed #cbd5e1" }}>
                No customers directly onboarded by this affiliate yet.
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
