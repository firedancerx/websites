"use client";

import React, { useState } from "react";
import Link from "next/link";
import InvoiceDocumentModal, { type InvoiceDealData } from "../../components/InvoiceDocumentModal";

export default function InvoicesView({ invoices = [] }: { invoices?: InvoiceDealData[] }) {
  const [activeTab, setActiveTab] = useState<"ALL" | "UNCOLLECTED" | "PAID">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<InvoiceDealData | null>(null);
  const [collectionModalDeal, setCollectionModalDeal] = useState<InvoiceDealData | null>(null);

  // Financial Metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.contract_value_myr || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.total_collected_myr || 0), 0);
  const totalBalanceDue = Math.max(0, totalInvoiced - totalCollected);

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const contractVal = Number(inv.contract_value_myr || 0);
    const collectedVal = Number(inv.total_collected_myr || 0);
    const isPaid = (contractVal - collectedVal) <= 0.01 || inv.status === "FULLY_COLLECTED";

    if (activeTab === "UNCOLLECTED" && isPaid) return false;
    if (activeTab === "PAID" && !isPaid) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = inv.invoice_number?.toLowerCase().includes(q);
      const matchCustomer = inv.customer_name.toLowerCase().includes(q);
      const matchAffiliate = inv.affiliate_legal_name?.toLowerCase().includes(q) || inv.affiliate_code?.toLowerCase().includes(q);
      const matchDealCode = inv.deal_code.toLowerCase().includes(q);
      const matchPackage = inv.package_name.toLowerCase().includes(q);
      if (!matchNumber && !matchCustomer && !matchAffiliate && !matchDealCode && !matchPackage) {
        return false;
      }
    }

    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. FINANCIAL SUMMARY KPI STAT CARDS */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div className="stat" style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
          <small style={{ color: "#475569", fontWeight: 700 }}>Total Tax Invoices Issued</small>
          <strong style={{ color: "#0f172a" }}>{invoices.length} Invoices</strong>
        </div>

        <div className="stat" style={{ background: "#f3e8ff", border: "1.5px solid #d8b4fe" }}>
          <small style={{ color: "#6b21a8", fontWeight: 700 }}>Total Invoiced Value</small>
          <strong style={{ color: "#6b21a8" }}>
            RM {totalInvoiced.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
        </div>

        <div className="stat" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
          <small style={{ color: "#166534", fontWeight: 700 }}>Total Collections Received</small>
          <strong style={{ color: "#15803d" }}>
            RM {totalCollected.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
        </div>

        <div className="stat" style={{ background: totalBalanceDue > 0 ? "#fff1f2" : "#f0fdf4", border: totalBalanceDue > 0 ? "1.5px solid #fecdd3" : "1.5px solid #bbf7d0" }}>
          <small style={{ color: totalBalanceDue > 0 ? "#9f1239" : "#166534", fontWeight: 700 }}>Remaining Balance Due</small>
          <strong style={{ color: totalBalanceDue > 0 ? "#be123c" : "#15803d" }}>
            RM {totalBalanceDue.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px 20px",
          borderRadius: 12,
          border: "1.5px solid #cbd5e1",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, customer name, affiliate, deal code, package..."
              style={{
                width: "100%",
                padding: "10px 36px 10px 14px",
                fontSize: 14,
                borderRadius: 8,
                border: "1.5px solid #94a3b8",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "ALL", label: `All Invoices (${invoices.length})` },
              { key: "UNCOLLECTED", label: `⏳ Uncollected / Partial (${invoices.filter((i) => Number(i.contract_value_myr) - Number(i.total_collected_myr) > 0.01).length})` },
              { key: "PAID", label: `✓ Fully Paid (${invoices.filter((i) => Number(i.contract_value_myr) - Number(i.total_collected_myr) <= 0.01 || i.status === "FULLY_COLLECTED").length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? 700 : 600,
                  background: activeTab === tab.key ? "#0f766e" : "#f1f5f9",
                  color: activeTab === tab.key ? "#ffffff" : "#475569",
                  border: activeTab === tab.key ? "1px solid #0f766e" : "1px solid #cbd5e1",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. INVOICES DATA TABLE */}
      <div className="admin-card" style={{ padding: 0, borderRadius: 12, overflow: "hidden", border: "1.5px solid #cbd5e1" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", fontSize: 12, textTransform: "uppercase", color: "#475569" }}>
                <th style={{ padding: "12px 16px" }}>Invoice #</th>
                <th style={{ padding: "12px 16px" }}>Billed Recipient</th>
                <th style={{ padding: "12px 16px" }}>Deal & Customer</th>
                <th style={{ padding: "12px 16px" }}>Package Details</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Contract Value</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Total Collected</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Balance Due</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: 13, color: "#1e293b" }}>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                    No issued tax invoices found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const contractVal = Number(inv.contract_value_myr || 0);
                  const collectedVal = Number(inv.total_collected_myr || 0);
                  const balanceDue = Math.max(0, contractVal - collectedVal);
                  const isFullyPaid = balanceDue <= 0.01 || inv.status === "FULLY_COLLECTED";
                  const isPartial = collectedVal > 0 && balanceDue > 0.01;
                  const isBilledToAffiliate = inv.invoice_target === "AFFILIATE";
                  const invoiceNumber = inv.invoice_number || `INV-2026-${String(inv.id).padStart(4, "0")}`;

                  return (
                    <tr key={inv.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#6b21a8", fontSize: 14 }}>{invoiceNumber}</strong>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {inv.signed_date ? new Date(inv.signed_date).toLocaleDateString("en-MY") : new Date(inv.created_at).toLocaleDateString("en-MY")}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#0f172a" }}>
                          {isBilledToAffiliate ? inv.affiliate_legal_name : inv.customer_name}
                        </strong>
                        <div style={{ fontSize: 11 }}>
                          <span
                            style={{
                              background: isBilledToAffiliate ? "#f3e8ff" : "#e0f2fe",
                              color: isBilledToAffiliate ? "#6b21a8" : "#0369a1",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontWeight: 700,
                            }}
                          >
                            {isBilledToAffiliate ? `Affiliate (${inv.affiliate_code})` : "Prospect / Customer"}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <Link href={`/admin/deals/${inv.id}`} style={{ fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
                          {inv.deal_code}
                        </Link>
                        <div style={{ fontSize: 12, color: "#475569" }}>{inv.customer_name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Partner: {inv.affiliate_legal_name}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{inv.package_name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {inv.package_count} {inv.package_name?.includes("5-User") ? (Number(inv.package_count) > 1 ? `Blocks (${Number(inv.package_count) * 5} Seats)` : "Block (5 Seats)") : "Units"}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700 }}>
                        RM {contractVal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#15803d" }}>
                        RM {collectedVal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: balanceDue > 0 ? "#991b1b" : "#166534" }}>
                        RM {balanceDue.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {isFullyPaid ? (
                          <span style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                            ✓ FULLY PAID
                          </span>
                        ) : isPartial ? (
                          <span style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                            ⏳ PARTIAL
                          </span>
                        ) : (
                          <span style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                            ⚠️ UNCOLLECTED
                          </span>
                        )}
                        {inv.is_test === 1 && (
                          <div style={{ marginTop: 4 }}>
                            <span style={{ fontSize: 10, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "2px 5px", borderRadius: 4, fontWeight: 700 }}>
                              🧪 TEST
                            </span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForModal(inv)}
                            style={{
                              background: "#6b21a8",
                              color: "#ffffff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            📄 View Invoice
                          </button>

                          {!isFullyPaid && (
                            <button
                              type="button"
                              onClick={() => setCollectionModalDeal(inv)}
                              style={{
                                background: "#0f766e",
                                color: "#ffffff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              💰 Record Collection
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW/PRINT INVOICE DOCUMENT */}
      {selectedInvoiceForModal && (
        <InvoiceDocumentModal
          deal={selectedInvoiceForModal}
          onClose={() => setSelectedInvoiceForModal(null)}
          onRecordCollection={() => {
            const targetDeal = selectedInvoiceForModal;
            setSelectedInvoiceForModal(null);
            setCollectionModalDeal(targetDeal);
          }}
        />
      )}

      {/* MODAL 2: RECORD COLLECTION DIRECTLY FROM INVOICE PAGE */}
      {collectionModalDeal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 540, padding: 26, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#0f766e" }}>💰 Record Payment Collection</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              Invoice #: <b>{collectionModalDeal.invoice_number || `INV-2026-${collectionModalDeal.id}`}</b> · Customer: <b>{collectionModalDeal.customer_name}</b><br />
              Contract Total: RM {Number(collectionModalDeal.contract_value_myr).toFixed(2)} · Previous Collections: RM {Number(collectionModalDeal.total_collected_myr || 0).toFixed(2)}
            </p>

            <form action={`/foliodesk/api/admin/deals/${collectionModalDeal.id}/collect`} method="post" encType="multipart/form-data">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Invoice Number *</label>
                    <input name="invoiceNumber" readOnly defaultValue={collectionModalDeal.invoice_number || `INV-2026-${collectionModalDeal.id}`} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Invoice Total (MYR) *</label>
                    <input name="invoiceTotalMyr" type="number" step="0.01" defaultValue={collectionModalDeal.contract_value_myr} readOnly style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", background: "#f8fafc" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Collected Amount (MYR) *</label>
                    <input
                      name="collectedAmountMyr"
                      type="number"
                      step="0.01"
                      defaultValue={Math.max(0, Number(collectionModalDeal.contract_value_myr) - Number(collectionModalDeal.total_collected_myr || 0))}
                      required
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #0f766e", fontWeight: 800 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: 13 }}>Collection Date *</label>
                    <input name="collectionDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Bank Receipt / Tx Reference *</label>
                  <input name="bankReceiptRef" required placeholder="e.g. MBB-9831902 / DUITNOW-8912" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Proof Media File (Optional PDF / Image)</label>
                  <input name="proofFile" type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="isFinalCollection" name="isFinalCollection" value="1" defaultChecked />
                  <label htmlFor="isFinalCollection" style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    This is the final full payment collection for this contract
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" className="button secondary" onClick={() => setCollectionModalDeal(null)}>Cancel</button>
                <button type="submit" className="button primary" style={{ background: "#0f766e", borderColor: "#0d655e", fontWeight: 700 }}>
                  Submit Collection for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
