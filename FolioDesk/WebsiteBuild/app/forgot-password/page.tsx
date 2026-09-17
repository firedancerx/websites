import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "../../lib/auth";
import { ensureCsrfCookie, CSRF_FIELD } from "../../lib/csrf";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Forgot Password | FolioDesk",
  robots: { index: false, follow: false },
};

// T-510 follow-on fix: step 1 of 2. Previously this page also collected the
// new password directly, alongside only an email address -- no proof the
// submitter owned that inbox. It now only collects the email; the emailed
// link (see app/api/forgot-password/route.ts) carries a single-use token to
// /reset-password, which is where the new password is actually set.
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await currentUser();
  if (user) redirect("/portal");

  const q = await searchParams;
  const csrfToken = await ensureCsrfCookie();

  return (
    <section className="login-wrap">
      <div className="login-card">
        <div className="eyebrow">ACCOUNT RECOVERY</div>
        <h1>Reset password</h1>
        <p>
          Enter your registered account email address. If it matches an account, we&apos;ll email you a link to reset your password.
        </p>

        {q.error && <p className="notice error">{q.error}</p>}
        {q.success && (
          <p
            className="notice"
            style={{
              background: "rgba(16,185,129,0.1)",
              borderColor: "#10b981",
              color: "#065f46",
            }}
          >
            {q.success}
          </p>
        )}

        <form action="/foliodesk/api/forgot-password" method="post">
          <input type="hidden" name={CSRF_FIELD} value={csrfToken} />
          <div className="field">
            <label htmlFor="email">Registered email address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button className="button primary submit" type="submit" style={{ flex: 1 }}>
              Send reset link
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
