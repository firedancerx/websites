"use client";

import { useState } from "react";

interface UserRow {
  id: number;
  email: string;
  full_name: string;
  role: "APPLICANT" | "AFFILIATE" | "ADMIN" | "MANAGEMENT";
  status: "ACTIVE" | "SUSPENDED";
  created_at: string;
}

const ROLE_OPTIONS = ["APPLICANT", "AFFILIATE", "ADMIN", "MANAGEMENT"] as const;

const ROLE_BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  APPLICANT: { bg: "#f1f5f9", color: "#475569" },
  AFFILIATE: { bg: "#eff6ff", color: "#1d4ed8" },
  ADMIN: { bg: "#fef3c7", color: "#92400e" },
  MANAGEMENT: { bg: "#ede9fe", color: "#5b21b6" },
};

export default function AdminUsersView({
  users,
  currentAdminId,
}: {
  users: UserRow[];
  currentAdminId: number;
}) {
  const [rows, setRows] = useState<UserRow[]>(users);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Record<number, string>>({});

  const handleChangeRole = async (userId: number) => {
    const role = selectedRole[userId];
    if (!role) return;
    setError(null);
    setPendingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update role.");
        return;
      }
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, role: role as UserRow["role"] } : u)));
    } catch {
      setError("Network error updating role.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="admin-card" style={{ padding: 24, borderRadius: 12, marginTop: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, margin: "0 0 4px", color: "#0f172a" }}>👤 Accounts</h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Changing a role to ADMIN or MANAGEMENT is blocked if the user has ever held the other role
          (checked against audit history) -- this is a permanent, org-wide rule, not a per-transaction check.
        </p>
      </div>

      {error && (
        <div className="notice error" style={{ marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "10px 12px", color: "#475569" }}>Name</th>
              <th style={{ padding: "10px 12px", color: "#475569" }}>Email</th>
              <th style={{ padding: "10px 12px", color: "#475569" }}>Current Role</th>
              <th style={{ padding: "10px 12px", color: "#475569" }}>Status</th>
              <th style={{ padding: "10px 12px", color: "#475569" }}>Change Role To</th>
              <th style={{ padding: "10px 12px", color: "#475569", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const badge = ROLE_BADGE_STYLE[u.role] || ROLE_BADGE_STYLE.APPLICANT;
              const isSelf = u.id === currentAdminId;
              return (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>
                    {u.full_name} {isSelf && <span style={{ color: "#94a3b8", fontWeight: 400 }}>(you)</span>}
                  </td>
                  <td style={{ padding: "12px", color: "#475569" }}>{u.email}</td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px", color: u.status === "ACTIVE" ? "#059669" : "#dc2626" }}>
                    {u.status}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <select
                      value={selectedRole[u.id] ?? u.role}
                      onChange={(e) => setSelectedRole((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      disabled={pendingId === u.id}
                      style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13 }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleChangeRole(u.id)}
                      disabled={pendingId === u.id || (selectedRole[u.id] ?? u.role) === u.role}
                      className="button primary"
                      style={{
                        background: "#0284c7",
                        borderColor: "#0369a1",
                        fontWeight: 700,
                        fontSize: 12,
                        opacity: pendingId === u.id || (selectedRole[u.id] ?? u.role) === u.role ? 0.5 : 1,
                      }}
                    >
                      {pendingId === u.id ? "Saving…" : "Apply"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
