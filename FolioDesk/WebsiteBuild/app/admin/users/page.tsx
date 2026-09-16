import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { getAdminDataMode } from "../../../lib/settings";
import AdminNav from "../AdminNav";
import AdminUsersView from "./AdminUsersView";

// T-302 (plan §7.1, §7.6, §7.7 step 2): role-provisioning screen. ADMIN-only,
// matching this codebase's existing admin-screen convention.

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | User & Role Management",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const [users] = await db().execute<any[]>(
    "SELECT id, email, full_name, role, status, created_at FROM users ORDER BY created_at DESC"
  );
  const dataMode = await getAdminDataMode();

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME ADMIN</div>
          <h1>User & Role Management</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
            Provision Admin and Management accounts. Strict separation of duties is enforced org-wide:
            a user who has ever held ADMIN can never hold MANAGEMENT, and vice versa.
          </p>
        </div>
      </div>

      <AdminNav currentDataMode={dataMode} />

      <AdminUsersView users={JSON.parse(JSON.stringify(users))} currentAdminId={admin.id} />
    </section>
  );
}
