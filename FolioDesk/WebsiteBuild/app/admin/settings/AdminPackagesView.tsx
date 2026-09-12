"use client";

import { useState } from "react";
import type { PackageItem } from "../../../lib/packages";

export default function AdminPackagesView({ packages }: { packages: PackageItem[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);

  const handleOpenAdd = () => {
    setEditingPackage(null);
    setShowModal(true);
  };

  const handleOpenEdit = (pkg: PackageItem) => {
    setEditingPackage(pkg);
    setShowModal(true);
  };

  return (
    <div className="admin-card" style={{ padding: 24, borderRadius: 12, marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, margin: "0 0 4px", color: "#0f172a" }}>
            📦 FolioDesk Commercial Packages
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Define software packages and annual subscription tiers selectable by affiliates during client introductions.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="button primary"
          style={{ background: "#0284c7", borderColor: "#0369a1", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <span>➕</span> Add Product Package
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "10px 12px", color: "#475569" }}>Package Name</th>
              <th style={{ padding: "10px 12px", color: "#475569" }}>Package Code</th>
              <th style={{ padding: "10px 12px", color: "#475569", textAlign: "right" }}>Unit Price (MYR)</th>
              <th style={{ padding: "10px 12px", color: "#475569" }}>Billing Cycle</th>
              <th style={{ padding: "10px 12px", color: "#475569" }}>Status</th>
              <th style={{ padding: "10px 12px", color: "#475569", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {packages.length > 0 ? (
              packages.map((pkg) => (
                <tr key={pkg.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>
                    {pkg.package_name}
                  </td>
                  <td style={{ padding: "12px", fontFamily: "monospace", fontWeight: 600, color: "#2563eb" }}>
                    {pkg.package_code}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 800, color: "#0f766e" }}>
                    RM {pkg.unit_price_myr.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "12px", color: "#64748b" }}>
                    {pkg.billing_cycle}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                        background: pkg.is_active ? "#dcfce7" : "#fee2e2",
                        color: pkg.is_active ? "#15803d" : "#b91c1c",
                        border: `1px solid ${pkg.is_active ? "#bbf7d0" : "#fca5a5"}`,
                      }}
                    >
                      {pkg.is_active ? "● ACTIVE" : "○ INACTIVE"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(pkg)}
                      className="button secondary"
                      style={{ padding: "4px 12px", fontSize: 12, fontWeight: 700 }}
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                  No packages defined.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT PACKAGE MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#ffffff", borderRadius: 12, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#0f172a" }}>
              {editingPackage ? "✏️ Edit Product Package" : "➕ Add Product Package"}
            </h3>

            <form action="/foliodesk/api/admin/packages" method="post">
              {editingPackage?.id && <input type="hidden" name="id" value={editingPackage.id} />}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Package Name *</label>
                  <input
                    name="packageName"
                    defaultValue={editingPackage?.package_name || ""}
                    required
                    placeholder="e.g. FolioDesk 5 Seat Package"
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Package Code *</label>
                  <input
                    name="packageCode"
                    defaultValue={editingPackage?.package_code || ""}
                    required
                    placeholder="e.g. FD-5SEAT-ANNUAL"
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", textTransform: "uppercase", fontFamily: "monospace" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Unit Price (MYR) *</label>
                    <input
                      name="unitPriceMyr"
                      type="number"
                      step="0.01"
                      min="1"
                      defaultValue={editingPackage?.unit_price_myr || 60000}
                      required
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #0f766e", fontWeight: 800, color: "#0f766e" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Billing Cycle</label>
                    <input
                      name="billingCycle"
                      defaultValue={editingPackage?.billing_cycle || "per annum"}
                      required
                      placeholder="per annum"
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 6, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    value="1"
                    defaultChecked={editingPackage ? editingPackage.is_active : true}
                  />
                  <label htmlFor="isActive" style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", cursor: "pointer" }}>
                    Active (Available for affiliate selection)
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#0284c7", borderColor: "#0369a1", fontWeight: 700 }}>
                  {editingPackage ? "Save Changes" : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
