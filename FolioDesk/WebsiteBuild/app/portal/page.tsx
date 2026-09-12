import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "../../lib/auth";
import { db } from "../../lib/db";
import { getCountries, getStates } from "../../lib/db-locations";
import { getActivePackages } from "../../lib/packages";
import ProfileEditForm from "./ProfileEditForm";
import RetractButton from "./RetractButton";
import PortalTabsView, { type PortalDealItem, type PortalAdviceItem } from "./PortalTabsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Profile | FolioDesk Affiliate Portal", robots: { index: false, follow: false } };

export default async function Portal({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string; success?: string; tab?: string }>;
}) {
  const q = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");

  const [rows] = await db().execute<any[]>(
    "SELECT * FROM affiliate_applications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1",
    [user.id]
  );
  const a = rows[0];
  const isRetracted = a?.status === "RETRACTED" || a?.status === "RETRACTION_ACKNOWLEDGED";
  const isSuspended = user.status === "SUSPENDED" || a?.status === "SUSPENDED" || a?.status === "TERMINATED";
  const isEditing = q.edit === "1" && !isSuspended && !isRetracted;

  const countries = await getCountries();
  const states = await getStates();
  const packages = await getActivePackages();

  let deals: any[] = [];
  let advices: any[] = [];
  let batches: any[] = [];
  let directDownlinesCount = 0;
  let latestProfileUpdate: any = null;

  if (a) {
    const [upRows] = await db().execute<any[]>(
      "SELECT * FROM affiliate_profile_updates WHERE application_id=? ORDER BY created_at DESC LIMIT 1",
      [a.id]
    );
    latestProfileUpdate = upRows[0] || null;

    const [dRows] = await db().execute<any[]>(
      `SELECT dp.*, 
         COALESCE((SELECT SUM(c.collected_amount_myr) FROM deal_collections c WHERE c.deal_id = dp.id AND c.approval_status = 'APPROVED'), 0) AS total_collected_myr
       FROM deal_pipeline dp
       WHERE dp.affiliate_id = ?
       ORDER BY dp.created_at DESC`,
      [a.id]
    );
    deals = dRows;

    const [advRows] = await db().execute<any[]>(
      `SELECT pa.*, 
         dp.deal_code, 
         dp.customer_name, 
         dc.invoice_number, 
         dc.bank_receipt_ref, 
         dc.collection_date 
       FROM payment_advices pa 
       JOIN deal_pipeline dp ON dp.id = pa.deal_id 
       JOIN deal_collections dc ON dc.id = pa.collection_id 
       WHERE pa.beneficiary_affiliate_id = ? 
       ORDER BY pa.created_at DESC`,
      [a.id]
    );
    advices = advRows;

    const [batchRows] = await db().execute<any[]>(
      `SELECT pb.*, u.full_name AS disburser_name 
       FROM payout_batches pb 
       LEFT JOIN users u ON u.id = pb.disbursed_by 
       WHERE pb.beneficiary_affiliate_id = ? 
       ORDER BY pb.disbursed_at DESC`,
      [a.id]
    );
    batches = batchRows;

    if (a.affiliate_code) {
      const [downRows] = await db().execute<any[]>(
        "SELECT COUNT(*) AS count FROM affiliate_applications WHERE upline_affiliate_code=?",
        [a.affiliate_code]
      );
      directDownlinesCount = Number(downRows[0]?.count || 0);
    }
  }

  return (
    <section className="admin-wrap" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">AFFILIATE PORTAL</div>
          <h1>{isEditing ? "Edit Application" : user.full_name}</h1>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {user.role === "ADMIN" && (
            <Link className="button secondary" href="/admin">Admin Dashboard</Link>
          )}

          {/* REINSTATEMENT ACTION (Available when retracted) */}
          {isRetracted && (
            <Link
              className="button primary"
              href="/register?reinstatement=1"
              style={{
                background: "#2563eb",
                borderColor: "#1d4ed8",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🔄</span> Apply for Reinstatement
            </Link>
          )}

          {/* EDIT BUTTON (Only available when not retracted and not suspended) */}
          {!isEditing && !isSuspended && !isRetracted && (
            <Link className="button primary" href="/portal?edit=1" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span>✏️</span> {a && a.status !== "APPROVED" ? "Edit Application and Resubmit" : "Edit profile"}
            </Link>
          )}

          {/* RETRACT AFFILIATESHIP BUTTON (Available at any stage until retracted) */}
          {a && !isRetracted && !isEditing && (
            <RetractButton />
          )}
        </div>
      </div>

      {q.success && (
        <p className="notice" style={{ background: "rgba(16,185,129,0.1)", borderColor: "#10b981", color: "#065f46", marginBottom: 20 }}>
          ✓ {q.success}
        </p>
      )}
      {q.error && <p className="notice error" style={{ marginBottom: 20 }}>⚠️ {q.error}</p>}

      {isEditing ? (
        <ProfileEditForm user={user} application={a} pendingUpdate={latestProfileUpdate} countries={countries} states={states} error={q.error} success={q.success} />
      ) : (
        <PortalTabsView
          deals={deals as PortalDealItem[]}
          advices={advices as PortalAdviceItem[]}
          batches={batches as any[]}
          isRetracted={isRetracted}
          isSuspended={isSuspended}
          affiliateId={a?.id}
          affiliateCode={a?.affiliate_code}
          packages={packages}
          initialTab={q.tab === "profile" ? "PROFILE" : "PIPELINE"}
        >
          {/* PENDING eKYC PROFILE UPDATE NOTIFICATION BANNER & PROPOSED CHANGES CARD */}
          {!isRetracted && latestProfileUpdate && latestProfileUpdate.status === "PENDING_APPROVAL" && (
            <div
              style={{
                background: "#eff6ff",
                border: "2px solid #3b82f6",
                padding: "20px 24px",
                borderRadius: 10,
                marginBottom: 24,
                boxShadow: "0 4px 14px rgba(59, 130, 246, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 26 }}>⏳</span>
                  <div>
                    <h3 style={{ color: "#1e40af", fontSize: 20, margin: 0 }}>
                      Profile Update Pending Admin eKYC Review
                    </h3>
                    <p style={{ color: "#1d4ed8", fontSize: 13, margin: "2px 0 0 0" }}>
                      Submitted {new Date(latestProfileUpdate.created_at).toLocaleDateString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    padding: "4px 14px",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  PENDING eKYC REVIEW
                </span>
              </div>

              <p style={{ color: "#1e3a8a", fontSize: 14, lineHeight: 1.6, margin: "0 0 16px 0" }}>
                Your submitted profile changes are currently undergoing Admin eKYC verification. <b>Your active profile below remains unchanged until approved.</b>
              </p>

              {/* PROPOSED PENDING CHANGES COMPARISON */}
              <div style={{ background: "#ffffff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#1e40af", fontSize: 15 }}>
                  📝 Proposed Pending Changes (Under Review):
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, fontSize: 13 }}>
                  {latestProfileUpdate.full_name !== user.full_name && (
                    <div><small style={{ color: "#64748b" }}>Proposed Full Name</small><p style={{ fontWeight: 700, color: "#1e40af", margin: "2px 0" }}>{latestProfileUpdate.full_name}</p></div>
                  )}
                  {latestProfileUpdate.legal_name !== a.legal_name && (
                    <div><small style={{ color: "#64748b" }}>Proposed Legal Name</small><p style={{ fontWeight: 700, color: "#1e40af", margin: "2px 0" }}>{latestProfileUpdate.legal_name}</p></div>
                  )}
                  {latestProfileUpdate.company_number !== a.company_number && (
                    <div><small style={{ color: "#64748b" }}>Proposed ID / Reg No.</small><p style={{ fontWeight: 700, color: "#1e40af", margin: "2px 0" }}>{latestProfileUpdate.company_number || "N/A"}</p></div>
                  )}
                  {latestProfileUpdate.phone !== a.phone && (
                    <div><small style={{ color: "#64748b" }}>Proposed Phone</small><p style={{ fontWeight: 700, color: "#1e40af", margin: "2px 0" }}>{latestProfileUpdate.phone}</p></div>
                  )}
                  {latestProfileUpdate.address_line1 !== a.address_line1 && (
                    <div><small style={{ color: "#64748b" }}>Proposed Address 1</small><p style={{ fontWeight: 700, color: "#1e40af", margin: "2px 0" }}>{latestProfileUpdate.address_line1}</p></div>
                  )}
                  {latestProfileUpdate.town !== a.town && (
                    <div><small style={{ color: "#64748b" }}>Proposed Town</small><p style={{ fontWeight: 700, color: "#1e40af", margin: "2px 0" }}>{latestProfileUpdate.town}</p></div>
                  )}
                  {latestProfileUpdate.state !== a.state && (
                    <div><small style={{ color: "#64748b" }}>Proposed State</small><p style={{ fontWeight: 700, color: "#1e40af", margin: "2px 0" }}>{latestProfileUpdate.state}</p></div>
                  )}
                  {latestProfileUpdate.postcode !== a.postcode && (
                    <div><small style={{ color: "#64748b" }}>Proposed Postcode</small><p style={{ fontWeight: 700, color: "#1e40af", margin: "2px 0" }}>{latestProfileUpdate.postcode}</p></div>
                  )}
                  {latestProfileUpdate.id_doc_path !== a.id_doc_path && (
                    <div><small style={{ color: "#64748b" }}>New ID Document Uploaded</small><p style={{ fontWeight: 700, color: "#1e40af", margin: "2px 0" }}><a href={latestProfileUpdate.id_doc_path} target="_blank" rel="noreferrer">📄 View proposed ID doc</a></p></div>
                  )}
                  {latestProfileUpdate.holding_id_path !== a.holding_id_path && (
                    <div><small style={{ color: "#64748b" }}>New Photo Holding ID Uploaded</small><p style={{ fontWeight: 700, color: "#1e40af", margin: "2px 0" }}><a href={latestProfileUpdate.holding_id_path} target="_blank" rel="noreferrer">📷 View proposed photo holding ID</a></p></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* REJECTED eKYC PROFILE UPDATE BANNER */}
          {!isRetracted && latestProfileUpdate && latestProfileUpdate.status === "REJECTED" && (
            <div
              style={{
                background: "#fef2f2",
                border: "2px solid #ef4444",
                padding: 16,
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <h3 style={{ color: "#991b1b", fontSize: 18, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <span>❌</span> Previous Profile Update Rejected by Admin
              </h3>
              {latestProfileUpdate.admin_remarks && (
                <p style={{ color: "#7f1d1d", fontSize: 14, margin: 0 }}>
                  <b>Reason / Remarks:</b> {latestProfileUpdate.admin_remarks}
                </p>
              )}
              <p style={{ color: "#991b1b", fontSize: 13, margin: "6px 0 0 0" }}>
                Your active profile remains unchanged. You may click &quot;Edit profile&quot; to submit a revised update.
              </p>
            </div>
          )}
          {/* RETRACTED AFFILIATESHIP NOTIFICATION BANNER */}
          {isRetracted && (
            <div
              style={{
                background: "#fef2f2",
                border: "2px solid #ef4444",
                padding: "20px 24px",
                borderRadius: 10,
                marginBottom: 24,
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.08)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 26 }}>🛑</span>
                  <h3 style={{ color: "#991b1b", fontSize: 20, margin: 0 }}>
                    Affiliateship Retracted (Read-Only Mode)
                  </h3>
                </div>
                <span
                  style={{
                    background: a.status === "RETRACTION_ACKNOWLEDGED" ? "#475569" : "#dc2626",
                    color: "#ffffff",
                    padding: "4px 12px",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  {a.status.replaceAll("_", " ")}
                </span>
              </div>

              <p style={{ color: "#7f1d1d", fontSize: 14, lineHeight: 1.6, margin: "0 0 14px 0" }}>
                You have retracted your FolioDesk affiliateship. Your profile is accessible below in <b>read-only mode</b> for your records. Profile editing and new partner activities are discontinued.
              </p>

              <div style={{ background: "#ffffff", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", color: "#1e293b", fontSize: 13, marginBottom: 16 }}>
                <p style={{ margin: 0, fontWeight: 600, color: "#0f766e", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🛡️</span> <b>Commission Rights Protected:</b>
                </p>
                <p style={{ margin: "4px 0 0 0", color: "#334155" }}>
                  Under FolioDesk programme terms, you will <b>continue to earn your affiliate commissions</b> for all businesses (customers) and downline affiliates you introduced while active.
                </p>
              </div>

              {/* REINSTATEMENT CTA BOX */}
              <div
                style={{
                  background: "#eff6ff",
                  border: "1.5px solid #bfdbfe",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <b style={{ color: "#1e40af", fontSize: 14 }}>Want to reinstate your affiliateship?</b>
                  <p style={{ margin: "2px 0 0 0", color: "#3b82f6", fontSize: 13 }}>
                    You can resubmit your old profile for reinstatement through our registration portal.
                  </p>
                </div>
                <Link
                  href="/register?reinstatement=1"
                  className="button primary"
                  style={{
                    background: "#2563eb",
                    borderColor: "#1d4ed8",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "8px 16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>🔄</span> Resubmit for Reinstatement
                </Link>
              </div>
            </div>
          )}

          {/* UNEDITABLE FEEDBACK BANNER FROM ADMIN CORRECTION REQUEST (When not retracted) */}
          {!isRetracted && a && (a.status === "CORRECTION_REQUIRED" || a.status === "INFORMATION_REQUIRED") && (
            <div style={{ background: "#fffbe6", border: "2px solid #f59e0b", padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <h3 style={{ color: "#b45309", fontSize: 18, marginTop: 0, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>⚠️</span> Reviewer Feedback ({a.status.replaceAll("_", " ")})
              </h3>
              {a.decision_note && (
                <p style={{ color: "#78350f", fontSize: 14, fontWeight: 500, margin: "0 0 10px 0" }}>
                  <b>Remarks:</b> {a.decision_note}
                </p>
              )}

              {(Boolean(a.flag_id_doc_unclear) || Boolean(a.flag_holding_id_unaccepted)) && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>Specific Items Flagged by Reviewer (Read-Only):</p>
                  <ul style={{ margin: 0, paddingLeft: 20, color: "#dc2626", fontSize: 14 }}>
                    {Boolean(a.flag_id_doc_unclear) && <li>ID document is not clear — Please re-upload a clear picture/scan</li>}
                    {Boolean(a.flag_holding_id_unaccepted) && <li>Photo holding ID document is unaccepted — Please re-upload a clear photo</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="admin-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 22, marginBottom: 12 }}>Account Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div><small style={{ color: "#666" }}>Full Name</small><p style={{ fontWeight: 600, fontSize: 16 }}>{user.full_name}</p></div>
              <div><small style={{ color: "#666" }}>Email Address</small><p style={{ fontWeight: 600, fontSize: 16 }}>{user.email}</p></div>
              <div><small style={{ color: "#666" }}>Role</small><p style={{ fontWeight: 600, fontSize: 16 }}>{user.role}</p></div>
            </div>
          </div>

          {a ? (
            <div className="admin-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <span className="badge" style={{ background: isRetracted ? "#fee2e2" : undefined, color: isRetracted ? "#991b1b" : undefined }}>
                    {a.status.replaceAll("_", " ")}
                  </span>
                  <h2 style={{ fontSize: 28, marginTop: 8 }}>Application {a.application_number}</h2>
                  <p style={{ color: "#666" }}>Submitted {new Date(a.submitted_at).toLocaleDateString("en-MY", { dateStyle: "long" })}</p>
                </div>
                {a.affiliate_code && (
                  <div className="notice" style={{ margin: 0, textAlign: "right" }}>
                    <b>Affiliate ID:</b> <span style={{ letterSpacing: "1px", fontWeight: 700 }}>{a.affiliate_code}</span>
                  </div>
                )}
              </div>

              <p style={{ background: "#f8fafc", padding: 12, borderRadius: 6, marginBottom: 20 }}>
                {a.decision_note || "Your application is securely stored. The FolioDesk team will update this page when review begins or more information is required."}
              </p>

              <h3 style={{ fontSize: 20, marginBottom: 12 }}>Application & Referral Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <div><small style={{ color: "#666" }}>Legal Name</small><p style={{ fontWeight: 600 }}>{a.legal_name}</p></div>
                <div><small style={{ color: "#666" }}>Applicant Type</small><p style={{ fontWeight: 600 }}>{a.applicant_type}</p></div>
                <div><small style={{ color: "#666" }}>{a.applicant_type === "INDIVIDUAL" ? "Personal ID / NRIC No." : "Company Reg. No."}</small><p style={{ fontWeight: 600 }}>{a.company_number || "N/A"}</p></div>
                <div><small style={{ color: "#666" }}>Country & Currency</small><p style={{ fontWeight: 600 }}>{a.country_code} ({a.currency})</p></div>
                <div><small style={{ color: "#666" }}>Phone</small><p style={{ fontWeight: 600 }}>{a.phone}</p></div>
                <div><small style={{ color: "#666" }}>Address Line 1</small><p style={{ fontWeight: 600 }}>{a.address_line1 || "N/A"}</p></div>
                <div><small style={{ color: "#666" }}>Address Line 2</small><p style={{ fontWeight: 600 }}>{a.address_line2 || "N/A"}</p></div>
                <div><small style={{ color: "#666" }}>Address Line 3</small><p style={{ fontWeight: 600 }}>{a.address_line3 || "N/A"}</p></div>
                <div><small style={{ color: "#666" }}>Postcode</small><p style={{ fontWeight: 600 }}>{a.postcode || "N/A"}</p></div>
                <div><small style={{ color: "#666" }}>Town / City</small><p style={{ fontWeight: 600 }}>{a.town || "N/A"}</p></div>
                <div><small style={{ color: "#666" }}>State / Region</small><p style={{ fontWeight: 600 }}>{a.state || "N/A"}</p></div>
                <div><small style={{ color: "#666" }}>Market Focus</small><p style={{ fontWeight: 600 }}>{a.market_focus}</p></div>
                <div><small style={{ color: "#666" }}>Website</small><p style={{ fontWeight: 600 }}>{a.website_url ? <a href={a.website_url} target="_blank" rel="noreferrer">{a.website_url}</a> : "N/A"}</p></div>
                <div><small style={{ color: "#666" }}>Social Profile</small><p style={{ fontWeight: 600 }}>{a.social_url ? <a href={a.social_url} target="_blank" rel="noreferrer">{a.social_url}</a> : "N/A"}</p></div>
                <div><small style={{ color: "#666" }}>Upline Affiliate Code</small><p style={{ fontWeight: 600 }}>{a.upline_affiliate_code || "None"}</p></div>
                {directDownlinesCount > 0 && (
                  <div>
                    <small style={{ color: "#0f766e", fontWeight: 700 }}>Direct Downlines</small>
                    <p style={{ fontWeight: 800, color: "#0f766e" }}>{directDownlinesCount} Active Downline{directDownlinesCount === 1 ? "" : "s"}</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20 }}>
                <small style={{ color: "#666" }}>Target Audience</small>
                <p style={{ marginTop: 4, color: "#334155" }}>{a.audience_description}</p>
              </div>

              <div style={{ marginTop: 12 }}>
                <small style={{ color: "#666" }}>Promotion Method</small>
                <p style={{ marginTop: 4, color: "#334155" }}>{a.promotion_method}</p>
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: 18, marginBottom: 12 }}>ID Verification Status</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6 }}>
                    <small style={{ color: "#666" }}>1. Picture of ID Document</small>
                    <p style={{ marginTop: 4, fontWeight: 500 }}>
                      {a.id_doc_path ? <a href={a.id_doc_path} target="_blank" rel="noreferrer">📄 View uploaded document</a> : "Not uploaded"}
                    </p>
                    {Boolean(a.flag_id_doc_unclear) && <p style={{ color: "#dc2626", fontSize: 13, margin: "4px 0 0 0", fontWeight: 600 }}>❌ Flagged: ID document not clear</p>}
                  </div>
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6 }}>
                    <small style={{ color: "#666" }}>2. Photo Holding ID Document</small>
                    <p style={{ marginTop: 4, fontWeight: 500 }}>
                      {a.holding_id_path ? <a href={a.holding_id_path} target="_blank" rel="noreferrer">📷 View uploaded photo</a> : "Not uploaded"}
                    </p>
                    {Boolean(a.flag_holding_id_unaccepted) && <p style={{ color: "#dc2626", fontSize: 13, margin: "4px 0 0 0", fontWeight: 600 }}>❌ Flagged: Photo holding ID unaccepted</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-card empty">No application record found.</div>
          )}
        </PortalTabsView>
      )}
    </section>
  );
}
