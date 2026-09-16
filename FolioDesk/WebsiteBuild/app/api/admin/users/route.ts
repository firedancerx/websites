import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

// T-302 (plan §7.1, §7.6, §7.7 step 2): minimal role-provisioning endpoint for
// the new MANAGEMENT role. Accounts were previously provisioned only via
// ADMIN_EMAIL/ADMIN_PASSWORD env vars and direct DB seeding -- this is the
// first UI-driven user/role management surface in the codebase.
//
// Restricted to ADMIN, matching every other admin/* API route's convention.
// (Deliberately NOT also allowed for MANAGEMENT: letting Management provision
// its own or Admin's accounts would undermine the separation-of-duties model
// this endpoint exists to enforce.)

const ASSIGNABLE_ROLES = new Set(["APPLICANT", "AFFILIATE", "ADMIN", "MANAGEMENT"]);

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [users] = await db().execute<any[]>(
    "SELECT id, email, full_name, role, status, created_at FROM users ORDER BY created_at DESC"
  );

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const targetUserId = Number(body?.userId);
  const newRole = String(body?.role || "");

  if (!targetUserId || !ASSIGNABLE_ROLES.has(newRole)) {
    return NextResponse.json({ error: "Invalid userId or role" }, { status: 400 });
  }

  const [userRows] = await db().execute<any[]>(
    "SELECT id, email, full_name, role FROM users WHERE id=? LIMIT 1",
    [targetUserId]
  );
  const targetUser = userRows[0];
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const currentRole = targetUser.role;
  if (currentRole === newRole) {
    return NextResponse.json({ error: "User already holds that role" }, { status: 400 });
  }

  // Strict separation of duties, org-wide (plan §7 locked decision): a user who
  // has EVER held ADMIN can never hold MANAGEMENT, and vice versa -- not just
  // "not on the same transaction". Checked against this user's full role-change
  // history in audit_events (action='USER_ROLE_CHANGED'), plus their current role,
  // since a user's very first role (set at registration/seeding) never generated
  // a ROLE_CHANGED event.
  if (newRole === "MANAGEMENT" || newRole === "ADMIN") {
    const opposingRole = newRole === "MANAGEMENT" ? "ADMIN" : "MANAGEMENT";

    if (currentRole === opposingRole) {
      return NextResponse.json(
        {
          error: `Cannot assign ${newRole}: this user currently holds ${opposingRole}. Strict separation of duties requires a user to never have held both roles.`,
        },
        { status: 409 }
      );
    }

    const [historyRows] = await db().execute<any[]>(
      `SELECT id FROM audit_events
       WHERE entity_type='user' AND entity_id=? AND action='USER_ROLE_CHANGED'
         AND (JSON_EXTRACT(event_data, '$.from')=? OR JSON_EXTRACT(event_data, '$.to')=?)
       LIMIT 1`,
      [String(targetUserId), opposingRole, opposingRole]
    );
    if (historyRows.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot assign ${newRole}: this user has previously held ${opposingRole} (per audit_events history). Strict separation of duties is permanent, org-wide, and does not lift when a role is revoked.`,
        },
        { status: 409 }
      );
    }
  }

  await db().execute("UPDATE users SET role=? WHERE id=?", [newRole, targetUserId]);

  await db().execute(
    "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'USER_ROLE_CHANGED','user',?,JSON_OBJECT('from',?,'to',?))",
    [admin.id, String(targetUserId), currentRole, newRole]
  );

  return NextResponse.json({ success: true, userId: targetUserId, from: currentRole, to: newRole });
}
