import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "../../lib/auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Forgot Password | FolioDesk",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await currentUser();
  if (user) redirect("/portal");

  const q = await searchParams;

  return (
    <section className="login-wrap">
      <div className="login-card">
        <div className="eyebrow">ACCOUNT RECOVERY</div>
        <h1>Reset password</h1>
        <p>
          Enter your registered account email address along with your new password to reset your access.
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
