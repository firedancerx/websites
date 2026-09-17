import Link from "next/link";
import { ensureCsrfCookie, CSRF_FIELD } from "../../lib/csrf";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Reset Password | FolioDesk",
  robots: { index: false, follow: false },
};

// T-510 follow-on fix: step 2 of 2. Reached only via the single-use link
// app/api/forgot-password/route.ts emails to the account holder; the token
// itself proves inbox ownership, so this page can safely collect the new
// password. Actual validation (token exists, unused, unexpired) happens in
// app/api/reset-password/route.ts, not here -- a page render never touches
// the database write path.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const q = await searchParams;
  const token = q.token || "";
  const csrfToken = await ensureCsrfCookie();

  if (!token) {
    return (
      <section className="login-wrap">
        <div className="login-card">
          <div className="eyebrow">ACCOUNT RECOVERY</div>
          <h1>Invalid reset link</h1>
          <p>This password reset link is missing its token. Please request a new one.</p>
          <Link className="button primary submit" href="/forgot-password" style={{ display: "inline-flex", justifyContent: "center" }}>
            Request a new link
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="login-wrap">
      <div className="login-card">
        <div className="eyebrow">ACCOUNT RECOVERY</div>
        <h1>Set a new password</h1>
        <p>Choose a new password for your account. This link can only be used once and expires 30 minutes after it was requested.</p>

        {q.error && <p className="notice error">{q.error}</p>}

        <form action="/foliodesk/api/reset-password" method="post">
          <input type="hidden" name={CSRF_FIELD} value={csrfToken} />
          <input type="hidden" name="token" value={token} />

          <div className="field">
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="At least 12 characters"
              minLength={12}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter new password"
              minLength={12}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button className="button primary submit" type="submit" style={{ flex: 1 }}>
              Reset password
            </button>
            <Link
              className="button secondary"
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Back to Sign in
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
