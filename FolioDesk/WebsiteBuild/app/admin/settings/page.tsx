import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { getCommissionSettings } from "../../../lib/settings";
import AdminNav from "../AdminNav";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Commission Rates & Closure Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const settings = await getCommissionSettings();
  const q = await searchParams;

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME ADMIN</div>
          <h1>Commission Rates & Closure Period Settings</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
            Configure standard commission rates and global prospect closure periods applied to all affiliates and unclosed transactions.
          </p>
        </div>
        <form action="/foliodesk/api/logout" method="post">
          <button className="button secondary">Sign out</button>
        </form>
      </div>

      <AdminNav />

      {q.success && (
        <div className="notice" style={{ background: "rgba(16,185,129,0.1)", borderColor: "#10b981", color: "#065f46", marginBottom: 20 }}>
          ✓ {q.success}
        </div>
      )}
      {q.error && <div className="notice error" style={{ marginBottom: 20 }}>⚠️ {q.error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, alignItems: "start" }}>
        {/* SETTINGS FORM */}
        <form
          action="/foliodesk/api/admin/settings"
          method="post"
          className="admin-card"
          style={{ padding: 24, borderRadius: 12 }}
        >
          <h2 style={{ fontSize: 20, margin: "0 0 8px", color: "#0f172a" }}>
            Global Affiliate Commission & Policy Settings
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
            These parameters govern commission calculations upon collection and determine the maximum open duration for prospect negotiations.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* DIRECT SELLING AFFILIATE RATE */}
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <label htmlFor="directRatePct" style={{ fontWeight: 700, fontSize: 15, color: "#0f766e", display: "flex", justifyContent: "space-between" }}>
                <span>🎯 Direct Selling Affiliate Rate (%)</span>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Default: 10.00%</span>
              </label>
              <p style={{ fontSize: 13, color: "#475569", margin: "4px 0 10px" }}>
                Commission percentage awarded to the affiliate who directly introduced and closed the customer contract.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  id="directRatePct"
                  name="directRatePct"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={settings.directRatePct.toFixed(2)}
                  required
                  style={{ width: 140, fontSize: 16, fontWeight: 700, padding: "8px 12px", borderRadius: 6, border: "1.5px solid #94a3b8" }}
                />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#475569" }}>% of Collected Amount</span>
              </div>
            </div>

            {/* UPLINE LEVEL 1 OVERRIDE RATE */}
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <label htmlFor="uplineL1RatePct" style={{ fontWeight: 700, fontSize: 15, color: "#1e40af", display: "flex", justifyContent: "space-between" }}>
                <span>🌿 Upline Level 1 (L1) Override Rate (%)</span>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Default: 3.00%</span>
              </label>
              <p style={{ fontSize: 13, color: "#475569", margin: "4px 0 10px" }}>
                Override commission awarded to the immediate parent upline who recruited the selling affiliate.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  id="uplineL1RatePct"
                  name="uplineL1RatePct"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={settings.uplineL1RatePct.toFixed(2)}
                  required
                  style={{ width: 140, fontSize: 16, fontWeight: 700, padding: "8px 12px", borderRadius: 6, border: "1.5px solid #94a3b8" }}
                />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#475569" }}>% of Collected Amount</span>
              </div>
            </div>

            {/* UPLINE LEVEL 2 OVERRIDE RATE */}
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <label htmlFor="uplineL2RatePct" style={{ fontWeight: 700, fontSize: 15, color: "#7c3aed", display: "flex", justifyContent: "space-between" }}>
                <span>🌱 Upline Level 2 (L2) Override Rate (%)</span>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Default: 1.50%</span>
              </label>
              <p style={{ fontSize: 13, color: "#475569", margin: "4px 0 10px" }}>
                Secondary override commission awarded to the grandparent upline in a 2-tier referral network.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  id="uplineL2RatePct"
                  name="uplineL2RatePct"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={settings.uplineL2RatePct.toFixed(2)}
                  required
                  style={{ width: 140, fontSize: 16, fontWeight: 700, padding: "8px 12px", borderRadius: 6, border: "1.5px solid #94a3b8" }}
                />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#475569" }}>% of Collected Amount</span>
              </div>
            </div>

            {/* GLOBAL PROSPECT CLOSURE PERIOD (DAYS) */}
            <div style={{ background: "#fffbeb", padding: 16, borderRadius: 8, border: "1.5px solid #fde68a" }}>
              <label htmlFor="closurePeriodDays" style={{ fontWeight: 700, fontSize: 15, color: "#b45309", display: "flex", justifyContent: "space-between" }}>
                <span>⏳ Default Prospect Closure Period (Days)</span>
                <span style={{ fontSize: 13, color: "#78350f", fontWeight: 500 }}>Default: 90 Days</span>
              </label>
              <p style={{ fontSize: 13, color: "#92400e", margin: "4px 0 10px" }}>
                The maximum allowed days from initial account log date for an affiliate to close a prospect. Exceeding this period allows Admin to force close the attempt (subject to affiliate appeal and extension).
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  id="closurePeriodDays"
                  name="closurePeriodDays"
                  type="number"
                  step="1"
                  min="7"
                  max="365"
                  defaultValue={settings.closurePeriodDays || 90}
                  required
                  style={{ width: 140, fontSize: 16, fontWeight: 700, padding: "8px 12px", borderRadius: 6, border: "1.5px solid #b45309" }}
                />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#92400e" }}>Days from Initial Log</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0", display: "flex", gap: 12, alignItems: "center" }}>
            <button className="button primary" type="submit" style={{ padding: "10px 24px", fontSize: 14, fontWeight: 700, background: "#0f766e" }}>
              💾 Save Settings
            </button>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Applies to all affiliates and active unclosed transactions.
            </span>
          </div>
        </form>

        {/* POLICY & CALCULATION PREVIEW */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="admin-card" style={{ padding: 20, borderRadius: 12, background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
            <h3 style={{ fontSize: 16, margin: "0 0 8px", color: "#1e40af", display: "flex", alignItems: "center", gap: 6 }}>
              <span>💡</span> Example Collection Breakdown
            </h3>
            <p style={{ fontSize: 13, color: "#3b82f6", margin: "0 0 12px" }}>
              Assume customer pays a milestone collection of <b>RM 50,000.00</b>:
            </p>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #dbeafe" }}>
                  <td style={{ padding: "6px 0", color: "#1e3a8a" }}>Customer Collection</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 700 }}>RM 50,000.00</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #dbeafe" }}>
                  <td style={{ padding: "6px 0", color: "#0f766e" }}>Direct Affiliate ({settings.directRatePct}%)</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 700, color: "#0f766e" }}>
                    RM {(50000 * (settings.directRatePct / 100)).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #dbeafe" }}>
                  <td style={{ padding: "6px 0", color: "#1e40af" }}>Upline L1 Override ({settings.uplineL1RatePct}%)</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 700, color: "#1e40af" }}>
                    RM {(50000 * (settings.uplineL1RatePct / 100)).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #dbeafe" }}>
                  <td style={{ padding: "6px 0", color: "#7c3aed" }}>Upline L2 Override ({settings.uplineL2RatePct}%)</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 700, color: "#7c3aed" }}>
                    RM {(50000 * (settings.uplineL2RatePct / 100)).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0 0", fontWeight: 700, color: "#0f172a" }}>Total Commission Disbursable</td>
                  <td style={{ padding: "8px 0 0", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                    RM {(50000 * ((settings.directRatePct + settings.uplineL1RatePct + settings.uplineL2RatePct) / 100)).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="admin-card" style={{ padding: 20, borderRadius: 12 }}>
            <h3 style={{ fontSize: 16, margin: "0 0 8px", color: "#0f172a" }}>
              🛡️ Prospect Exclusivity & Closure Rules
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
              <li><b>Anti-Poaching Exclusivity:</b> No affiliate can register the same company name while it is actively logged by another affiliate until the case is closed or stopped.</li>
              <li><b>Closure Deadline:</b> Calculated as <code>initial log date + closure period ({settings.closurePeriodDays || 90}d) + extension days</code>.</li>
              <li><b>Forced Closure & Appeals:</b> Overdue deals can be force-closed by Admin. Affiliates can submit an appeal requesting an extension.</li>
              <li><b>Direct Extensions:</b> Admin can extend the closure period at any time with or without an affiliate appeal.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
