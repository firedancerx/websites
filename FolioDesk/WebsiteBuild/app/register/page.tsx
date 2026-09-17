import RegistrationForm, { type ExistingApp } from "./RegistrationForm";
import { getCountries, getStates } from "../../lib/db-locations";
import { currentUser } from "../../lib/auth";
import { db } from "../../lib/db";
import { ensureCsrfCookie } from "../../lib/csrf";

export const dynamic = "force-dynamic";
export const metadata = { title: "Affiliate application", robots: { index: false, follow: false } };

export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; ref?: string; upline?: string; ref_id?: string; reinstatement?: string }>;
}) {
  const q = await searchParams;
  const csrfToken = await ensureCsrfCookie();
  const countries = await getCountries();
  const states = await getStates();

  const initialUpline = (q.ref || q.upline || q.ref_id || "").toUpperCase().trim();

  // Check if current user is logged in (e.g. for reinstatement)
  const user = await currentUser();
  let existingApp: ExistingApp | null = null;

  if (user) {
    const [rows] = await db().execute<DatabaseRow[]>(
      "SELECT * FROM affiliate_applications WHERE user_id=? ORDER BY submitted_at DESC LIMIT 1",
      [user.id]
    );
    existingApp = (rows[0] as DatabaseResultRow<ExistingApp> | undefined) || null;
  }

  const isReinstatement = Boolean(
    existingApp && (existingApp.status === "RETRACTED" || existingApp.status === "RETRACTION_ACKNOWLEDGED")
  );

  return (
    <>
      <section className="page-hero">
        <div className="eyebrow">
          {isReinstatement ? "REINSTATEMENT APPLICATION" : "AFFILIATE APPLICATION"}
        </div>
        <h1>
          {isReinstatement
            ? "Reactivate your FolioDesk affiliateship."
            : "Join FolioDesk at zero cost."}
        </h1>
        <p>
          {isReinstatement
            ? "Resubmit your profile details for review to reinstate your active affiliate partnership with FolioDesk."
            : "Create your account and submit one application. Your information is stored securely and reviewed by the FolioDesk programme team."}
        </p>
      </section>
      <section className="form-shell">
        <div className="form-card">
          <h2 style={{ fontSize: 32 }}>
            {isReinstatement ? "Review & Resubmit Profile" : "Tell us about you"}
          </h2>
          <RegistrationForm
            countries={countries}
            states={states}
            initialUpline={initialUpline}
            error={q.error}
            existingUser={user ? { id: user.id, email: user.email, full_name: user.full_name } : null}
            existingApp={existingApp}
            csrfToken={csrfToken}
          />
        </div>
        <aside className="side-panel">
          <div className="section-kicker">WHAT HAPPENS NEXT</div>
          <h3>Clear, traceable review</h3>
          <ul>
            <li>Immediate application number</li>
            <li>Retained 9-character Affiliate ID</li>
            <li>Secure account access</li>
            <li>Programme-team review</li>
            <li>Information requests when needed</li>
            <li>Recorded approval or rejection</li>
          </ul>
        </aside>
      </section>
    </>
  );
}
