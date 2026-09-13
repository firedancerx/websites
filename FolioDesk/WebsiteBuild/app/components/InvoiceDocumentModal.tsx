"use client";

import React, { useState } from "react";

export interface InvoiceDealData {
  id: number;
  deal_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  affiliate_legal_name?: string;
  affiliate_code?: string;
  affiliate_email?: string;
  package_name: string;
  package_count: number;
  contract_value_myr: number;
  total_collected_myr?: number;
  invoice_number: string | null;
  invoice_target?: "PROSPECT" | "AFFILIATE" | null;
  status: string;
  signed_date?: string | null;
  created_at: string;
  is_test?: number;
}

interface InvoiceDocumentModalProps {
  deal: InvoiceDealData;
  onClose: () => void;
  onRecordCollection?: () => void;
}

export default function InvoiceDocumentModal({
  deal,
  onClose,
  onRecordCollection,
}: InvoiceDocumentModalProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const invoiceNumber = deal.invoice_number || `INV-2026-${String(deal.id).padStart(4, "0")}`;
  const issueDateStr = deal.signed_date
    ? new Date(deal.signed_date).toLocaleDateString("en-MY", { dateStyle: "medium" })
    : new Date(deal.created_at).toLocaleDateString("en-MY", { dateStyle: "medium" });

  // Calculate 14 days due date
  const baseDate = deal.signed_date ? new Date(deal.signed_date) : new Date(deal.created_at);
  const dueDate = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const dueDateStr = dueDate.toLocaleDateString("en-MY", { dateStyle: "medium" });

  const affiliateName = deal.affiliate_legal_name || "N/A";
  const affiliateCode = deal.affiliate_code || "N/A";
  const affiliateEmail = deal.affiliate_email || deal.customer_email;

  const isBilledToAffiliate = deal.invoice_target === "AFFILIATE";
  const billedName = isBilledToAffiliate ? affiliateName : deal.customer_name;
  const billedEmail = isBilledToAffiliate ? affiliateEmail : deal.customer_email;
  const billedPhone = isBilledToAffiliate ? null : deal.customer_phone;
  const billedSubhead = isBilledToAffiliate ? `Affiliate Partner (${affiliateCode})` : "Prospect Customer";

  const contractVal = Number(deal.contract_value_myr || 0);
  const totalCollected = Number(deal.total_collected_myr || 0);
  const remainingBalance = Math.max(0, contractVal - totalCollected);

  const isFullyPaid = remainingBalance <= 0.01 || deal.status === "FULLY_COLLECTED";
  const isPartialPaid = totalCollected > 0 && remainingBalance > 0.01;

  // Package description & seat count calculations
  const packageCount = Number(deal.package_count || 1);
  const is5UserBlock = deal.package_name.includes("5-User");
  const blockDesc = is5UserBlock
    ? `${packageCount} ${packageCount > 1 ? "Blocks" : "Block"} (${packageCount * 5} User Seats Capacity)`
    : `${packageCount} ${packageCount > 1 ? "Units" : "Unit"}`;

  const handlePrint = () => {
    window.print();
  };

  const handleEmailClient = () => {
    setIsSendingEmail(true);
    const subject = encodeURIComponent(`Tax Invoice ${invoiceNumber} from FolioDesk - ${deal.customer_name}`);
    const body = encodeURIComponent(
      `Dear ${billedName},\n\n` +
      `Please find detailed below Tax Invoice #${invoiceNumber} for FolioDesk SaaS Enterprise Licensing.\n\n` +
      `Invoice Summary:\n` +
      `• Invoice Number: ${invoiceNumber}\n` +
      `• Date Issued: ${issueDateStr}\n` +
      `• Billed Entity: ${billedName}\n` +
      `• Package: ${deal.package_name} (${blockDesc})\n` +
      `• Total Amount: RM ${contractVal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}\n` +
      `• Amount Paid: RM ${totalCollected.toLocaleString("en-MY", { minimumFractionDigits: 2 })}\n` +
      `• Balance Due: RM ${remainingBalance.toLocaleString("en-MY", { minimumFractionDigits: 2 })}\n\n` +
      `Payment Account Details:\n` +
      `Bank: Maybank Islamic Berhad\n` +
      `Account Name: FolioDesk Technologies Sdn Bhd\n` +
      `Account Number: 5148-8900-1234\n` +
      `Swift Code: MBBEMYKL\n\n` +
      `Thank you for choosing FolioDesk.\n\n` +
      `Best regards,\n` +
      `FolioDesk Billing Team`
    );

    window.location.href = `mailto:${billedEmail}?subject=${subject}&body=${body}`;
    setTimeout(() => setIsSendingEmail(false), 1500);
  };

  return (
    <div
      className="modal-overlay invoice-modal-wrapper"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        overflowY: "auto",
      }}
    >
      {/* Dynamic CSS Print Styles for A4 Paper output */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .invoice-printable-area, .invoice-printable-area * {
            visibility: visible !important;
          }
          .invoice-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .invoice-action-bar, .modal-overlay {
            background: transparent !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 820,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #cbd5e1",
        }}
      >
        {/* MODAL ACTION BAR (NOT PRINTED) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            background: "#0f172a",
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
                Official Tax Invoice #{invoiceNumber}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                Billed Entity: <strong style={{ color: "#38bdf8" }}>{deal.invoice_target === "AFFILIATE" ? `Introducing Affiliate (End Customer: ${deal.customer_name})` : "Prospect / Customer"}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onRecordCollection && !isFullyPaid && (
              <button
                type="button"
                onClick={onRecordCollection}
                style={{
                  background: "#0f766e",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                💰 Record Collection
              </button>
            )}

            <button
              type="button"
              onClick={handleEmailClient}
              disabled={isSendingEmail}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              📧 Email Client
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🖨️ Print / Save PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                color: "#94a3b8",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                padding: "4px 8px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT CANVAS */}
        <div
          className="invoice-printable-area"
          style={{
            padding: "36px 44px",
            overflowY: "auto",
            background: "#ffffff",
            color: "#0f172a",
            fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {/* DOCUMENT BRANDING & TAX INVOICE HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f766e", paddingBottom: 24, marginBottom: 24 }}>
            <div>
              <div style={{ marginBottom: 12 }}>
                {/* The browser-native image is intentional for reliable printable invoice rendering. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/foliodesk/FolioDesk-logo-transparent.png"
                  alt="FolioDesk Enterprise Document Platform"
                  style={{ height: 52, maxWidth: 260, objectFit: "contain", display: "block" }}
                />
              </div>

              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                <strong>FolioDesk Technologies Sdn Bhd</strong><br />
                Registration No: 202601009899 (1584930-X)<br />
                SST Registration No: W10-2401-32000891<br />
                Level 28, Menara Folio, Persiaran KLCC, 50088 Kuala Lumpur<br />
                Billing Email: <code>billing@foliodesk.my</code> · Tel: +603-2188-9000
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ background: "#0f766e", color: "#ffffff", padding: "6px 16px", borderRadius: 6, display: "inline-block", fontSize: 14, fontWeight: 800, letterSpacing: "1px", marginBottom: 12 }}>
                TAX INVOICE
              </div>
              <div style={{ fontSize: 13, color: "#334155" }}>
                <div>Invoice #: <strong style={{ fontSize: 15, color: "#0f766e" }}>{invoiceNumber}</strong></div>
                <div>Date Issued: <strong>{issueDateStr}</strong></div>
                <div>Payment Due: <strong>{dueDateStr}</strong></div>
                <div>Deal Reference: <strong>{deal.deal_code}</strong></div>
              </div>

              {/* PAYMENT STATUS BADGE */}
              <div style={{ marginTop: 12 }}>
                {isFullyPaid ? (
                  <span style={{ background: "#dcfce7", color: "#166534", border: "1.5px solid #bbf7d0", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                    ✓ PAID IN FULL
                  </span>
                ) : isPartialPaid ? (
                  <span style={{ background: "#fef3c7", color: "#92400e", border: "1.5px solid #fde68a", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                    ⏳ PARTIALLY PAID (RM {totalCollected.toLocaleString("en-MY", { minimumFractionDigits: 2 })} Recv)
                  </span>
                ) : (
                  <span style={{ background: "#fee2e2", color: "#991b1b", border: "1.5px solid #fca5a5", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                    ⚠️ PAYMENT PENDING (UNCOLLECTED)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BILLED TO / SHIP TO ADDRESS BLOCK */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28, background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div>
              <small style={{ fontSize: 11, fontWeight: 800, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                BILLED TO ({billedSubhead})
              </small>
              <h3 style={{ margin: "4px 0 2px", fontSize: 16, color: "#0f172a", fontWeight: 700 }}>
                {billedName}
              </h3>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                {isBilledToAffiliate && <div>Legal Code: <strong>{affiliateCode}</strong></div>}
                <div>Email: {billedEmail}</div>
                {billedPhone && <div>Tel: {billedPhone}</div>}
              </div>

              {isBilledToAffiliate && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed #cbd5e1", fontSize: 12, color: "#0f766e" }}>
                  <strong>End Customer / Prospect Client:</strong><br />
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>{deal.customer_name}</span> ({deal.customer_email})
                </div>
              )}
            </div>

            <div>
              <small style={{ fontSize: 11, fontWeight: 800, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {isBilledToAffiliate ? "END CUSTOMER & PROJECT DETAILS" : "INTRODUCING PARTNER / PROJECT DETAILS"}
              </small>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginTop: 4 }}>
                <div style={{ background: isBilledToAffiliate ? "#fef3c7" : "transparent", padding: isBilledToAffiliate ? "6px 10px" : "0", borderRadius: 6, border: isBilledToAffiliate ? "1px solid #fde68a" : "none", marginBottom: 6 }}>
                  <strong>End Customer Name:</strong> <strong style={{ color: "#0f172a", fontSize: 14, display: "block" }}>{deal.customer_name}</strong>
                  {isBilledToAffiliate && (
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                      Email: <strong>{deal.customer_email}</strong>
                      {deal.customer_phone && <> · Tel: <strong>{deal.customer_phone}</strong></>}
                    </div>
                  )}
                </div>
                <div>Introducing Affiliate: <strong>{affiliateName}</strong> ({affiliateCode})</div>
                <div>Signing Status: <strong>Contract Executed</strong></div>
              </div>
            </div>
          </div>

          {/* ITEMIZED LINE ITEMS TABLE */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ background: "#0f766e", color: "#ffffff", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", borderRadius: "6px 0 0 6px" }}>Item / Description</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>Qty / Capacity</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>Unit Rate (MYR)</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>Tax Rate</th>
                <th style={{ padding: "10px 14px", textAlign: "right", borderRadius: "0 6px 6px 0" }}>Amount (MYR)</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: 13, color: "#1e293b" }}>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "16px 14px" }}>
                  <strong style={{ color: "#0f172a", fontSize: 14 }}>{deal.package_name}</strong>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    FolioDesk Enterprise Subscription License & Implementation Package
                  </div>
                  {isBilledToAffiliate && (
                    <div style={{ fontSize: 12, color: "#0f766e", marginTop: 4, fontWeight: 600 }}>
                      📋 Designated End Customer Account: <strong>{deal.customer_name}</strong> ({deal.customer_email})
                    </div>
                  )}
                </td>
                <td style={{ padding: "16px 14px", textAlign: "center", fontWeight: 600 }}>
                  {blockDesc}
                </td>
                <td style={{ padding: "16px 14px", textAlign: "right", fontWeight: 600 }}>
                  RM {(contractVal / packageCount).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: "16px 14px", textAlign: "right", color: "#64748b" }}>
                  0% (Exempt)
                </td>
                <td style={{ padding: "16px 14px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                  RM {contractVal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* FINANCIAL SUMMARY BREAKDOWN */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginBottom: 28 }}>
            <div style={{ flex: 1, background: "#f8fafc", padding: 18, borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#0f766e", fontWeight: 700 }}>
                🏦 Corporate Remittance / Bank Transfer Instructions
              </h4>
              <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                <div>Bank Name: <strong>Maybank Islamic Berhad</strong></div>
                <div>Account Name: <strong>FolioDesk Technologies Sdn Bhd</strong></div>
                <div>Account Number: <strong style={{ fontSize: 13, color: "#0f766e" }}>5148-8900-1234</strong></div>
                <div>Swift Code: <strong>MBBEMYKL</strong></div>
                <div>Payment Reference: Please quote <strong style={{ color: "#0f766e" }}>{invoiceNumber}</strong> in payment description</div>
              </div>
            </div>

            <div style={{ width: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#475569" }}>
                <span>Subtotal (Excl. SST):</span>
                <span>RM {contractVal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                <span>SST Tax (0%):</span>
                <span>RM 0.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                <span>Total Invoiced:</span>
                <span style={{ color: "#0f766e" }}>RM {contractVal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#166534", background: "#f0fdf4", borderRadius: 6, paddingLeft: 8, paddingRight: 8 }}>
                <span>Total Collected to Date:</span>
                <strong>RM {totalCollected.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 8px", fontSize: 15, fontWeight: 800, color: remainingBalance > 0 ? "#991b1b" : "#166534", background: remainingBalance > 0 ? "#fef2f2" : "#dcfce7", borderRadius: 6, marginTop: 8 }}>
                <span>Balance Due:</span>
                <span>RM {remainingBalance.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* FOOTER NOTICE */}
          <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: 16, textAlign: "center", fontSize: 11, color: "#64748b" }}>
            This is a computer-generated official tax invoice and does not require a physical signature.<br />
            Thank you for your business with FolioDesk.
          </div>
        </div>
      </div>
    </div>
  );
}
