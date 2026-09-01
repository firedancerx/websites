import Link from "next/link";

export const metadata = {
  title: "Sign in | FolioDesk",
  robots: { index: false, follow: false },
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string; success?: string }>;
}) {
  const q = await searchParams;

  return (
    <section className="login-wrap">
      <div className="login-card">
        <div className="eyebrow">SECURE PORTAL</div>
        <h1>Welcome back.</h1>
        <p>Applicants and FolioDesk administrators use the same secure sign-in.</p>

        {q.registered && (
          <p className="notice">Application received. Sign in to view its status.</p>
        )}
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
        {q.error && <p className="notice error">{q.error}</p>}

        <form action="/foliodesk/api/login" method="post">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>

          <div className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="password">Password</label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: "12px",
                  color: "#0f766e",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                I forgot my password
              </Link>
            </div>
            <input id="password" name="password" type="password" required />
          </div>

          <button className="button primary submit" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </section>
  );
}
