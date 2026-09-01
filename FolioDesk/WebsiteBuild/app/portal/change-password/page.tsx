import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Change password", robots: { index: false, follow: false } };

export default async function ChangePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const q = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <section className="login-wrap">
      <div className="login-card">
        <div className="eyebrow">ACCOUNT SECURITY</div>
        <h1>Change password</h1>
        <p>Update your password. Make sure the new password is at least 12 characters and matches the confirmation field.</p>

        {q.error && <p className="notice error">{q.error}</p>}

        <form action="/foliodesk/api/change-password" method="post">
          <div className="field">
            <label htmlFor="currentPassword">Current password</label>
            <input id="currentPassword" name="currentPassword" type="password" required />
          </div>
          <div className="field">
            <label htmlFor="newPassword">New password</label>
            <input id="newPassword" name="newPassword" type="password" minLength={12} required />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm new password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" minLength={12} required />
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button className="button primary submit" type="submit" style={{ flex: 1 }}>Update password</button>
            <Link className="button secondary" href={user.role === "ADMIN" ? "/admin" : "/portal"} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>Cancel</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
