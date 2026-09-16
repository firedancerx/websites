"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import ToggleTestModeButton from "./ToggleTestModeButton";

export interface AffiliateItem {
  id: number;
  user_id: number;
  application_number: string;
  applicant_type: string;
  legal_name: string;
  company_number?: string;
  country_code: string;
  state?: string;
  town?: string;
  address_line1?: string;
  phone: string;
  market_focus: string;
  status: string;
  affiliate_code?: string;
  upline_affiliate_code?: string;
  submitted_at: string;
  updated_at?: string;
  email: string;
  customer_count: number;
  active_prospects_count?: number;
  active_clients_count?: number;
  is_test?: number;
  has_pending_profile_update?: number;
}

export interface TreeNode extends AffiliateItem {
  downlines: TreeNode[];
  isVirtualGroup?: boolean;
}

function buildUplineTree(items: AffiliateItem[]): TreeNode[] {
  const codeToNode = new Map<string, TreeNode>();
  const virtualGroupNodes = new Map<string, TreeNode>();

  items.forEach((item) => {
    const node: TreeNode = { ...item, downlines: [] };
    if (item.affiliate_code) {
      codeToNode.set(item.affiliate_code.trim().toUpperCase(), node);
    }
  });

  const roots: TreeNode[] = [];

  items.forEach((item) => {
    const uplineCode = item.upline_affiliate_code ? item.upline_affiliate_code.trim().toUpperCase() : null;
    const selfCode = item.affiliate_code ? item.affiliate_code.trim().toUpperCase() : "";
    const node = selfCode && codeToNode.has(selfCode) ? codeToNode.get(selfCode)! : ({ ...item, downlines: [] } as TreeNode);

    if (uplineCode && uplineCode !== selfCode) {
      if (codeToNode.has(uplineCode)) {
        const parent = codeToNode.get(uplineCode)!;
        parent.downlines.push(node);
      } else {
        // Group under virtual upline code node if upline code is not an existing registered affiliate
        if (!virtualGroupNodes.has(uplineCode)) {
          const virtualNode: TreeNode = {
            id: -Math.abs(uplineCode.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0)),
            user_id: 0,
            application_number: `UPLINE-${uplineCode}`,
            applicant_type: "REFERRAL_NETWORK",
            legal_name: `Upline Network: ${uplineCode}`,
            country_code: item.country_code || "MY",
            phone: "",
            market_focus: item.market_focus || "BOTH",
            status: "EXTERNAL_UPLINE",
            affiliate_code: uplineCode,
            submitted_at: item.submitted_at,
            email: `Referral / Upline Code: ${uplineCode}`,
            customer_count: 0,
            downlines: [],
            isVirtualGroup: true,
          };
          virtualGroupNodes.set(uplineCode, virtualNode);
          roots.push(virtualNode);
        }
        const parent = virtualGroupNodes.get(uplineCode)!;
        parent.downlines.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function countTotalDownlines(node: TreeNode): number {
  let count = node.downlines.length;
  for (const child of node.downlines) {
    count += countTotalDownlines(child);
  }
  return count;
}

function countMatchingNodes(nodes: TreeNode[]): number {
  let count = 0;
  for (const n of nodes) {
    if (!n.isVirtualGroup) count += 1;
    count += countMatchingNodes(n.downlines);
  }
  return count;
}

function nodeMatchesQuery(node: TreeNode, q: string): boolean {
  if (!q.trim()) return true;
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const searchableText = [
    node.legal_name,
    node.email,
    node.phone,
    node.application_number,
    node.affiliate_code,
    node.upline_affiliate_code,
    node.applicant_type,
    node.country_code,
    node.state,
    node.town,
    node.company_number,
    node.market_focus,
    node.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return terms.every((t) => searchableText.includes(t));
}

function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  if (!q.trim()) return nodes;

  const result: TreeNode[] = [];

  for (const node of nodes) {
    const isSelfMatch = nodeMatchesQuery(node, q);
    const filteredDownlines = filterTree(node.downlines, q);

    if (isSelfMatch) {
      result.push({
        ...node,
        downlines: node.downlines,
      });
    } else if (filteredDownlines.length > 0) {
      result.push({
        ...node,
        downlines: filteredDownlines,
      });
    }
  }

  return result;
}

export default function AdminNetworkView({ initialApps }: { initialApps: AffiliateItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  // T-406 (plan §7.5, F-11): per-row double-submit guard for the decision form,
  // matching the pattern applied to Collections, Payouts and the appeal modal.
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fullTree = useMemo(() => buildUplineTree(initialApps), [initialApps]);
  const filteredTree = useMemo(() => filterTree(fullTree, searchQuery), [fullTree, searchQuery]);

  const count = (s: string) => initialApps.filter((a) => a.status === s).length;
  const downlineCount = initialApps.filter((a) => Boolean(a.upline_affiliate_code)).length;
  const totalActiveProspects = initialApps.reduce((sum, a) => sum + Number(a.active_prospects_count ?? 0), 0);
  const totalActiveClients = initialApps.reduce((sum, a) => sum + Number(a.active_clients_count ?? 0), 0);
  const pendingProfileUpdatesCount = initialApps.filter((a) => Boolean(a.has_pending_profile_update)).length;
  const matchingAppCount = useMemo(() => countMatchingNodes(filteredTree), [filteredTree]);

  function renderAffiliateNode(node: TreeNode, depth: number = 0) {
    const detailUrl = `/admin/applications/${node.id}/correction`;
    const totalNetworkCount = countTotalDownlines(node);
    const hasDownlines = node.downlines.length > 0;
    const isVirtual = Boolean(node.isVirtualGroup);

    return (
      <div key={node.id} style={{ marginTop: depth === 0 ? 20 : 10 }}>
        {/* AFFILIATE / UPLINE ROW CARD */}
        <div
          className="admin-card clickable-row"
          style={{
            padding: depth === 0 ? "20px 24px" : "14px 18px",
            background: isVirtual
              ? "#fffbeb"
              : depth === 0
              ? "#ffffff"
              : `rgba(240, 253, 244, ${Math.min(0.9, depth * 0.35)})`,
            border: isVirtual
              ? "2px dashed #f59e0b"
              : depth === 0
              ? "2px solid #cbd5e1"
              : "1px solid #a7f3d0",
            boxShadow: depth === 0 && !isVirtual ? "0 4px 14px rgba(15, 118, 110, 0.06)" : "none",
            borderRadius: 12,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1.6fr 1fr 1fr 1.1fr auto", gap: 16, alignItems: "center" }}>
            {/* APPLICANT, DOWNLINE & ONBOARDED CUSTOMERS BADGE */}
            <div>
              {isVirtual ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ background: "#d97706", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800, letterSpacing: "1px" }}>
                      🌿 UPLINE NETWORK CODE
                    </span>
                    <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, border: "1px solid #fde68a" }}>
                      👥 {node.downlines.length} Direct Downline{node.downlines.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 18, margin: "6px 0 2px", color: "#92400e" }}>
                    {node.legal_name}
                  </h3>
                  <p style={{ color: "#b45309", fontSize: 13, margin: 0 }}>
                    Referral network code shared by registered affiliates below.
                  </p>
                </div>
              ) : (
                <Link href={detailUrl} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {depth === 0 ? (
                      hasDownlines ? (
                        <span style={{ background: "#0f766e", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800, letterSpacing: "1px" }}>
                          UPLINE AFFILIATE
                        </span>
                      ) : (
                        <span style={{ background: "#334155", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800, letterSpacing: "1px" }}>
                          DIRECT AFFILIATE
                        </span>
                      )
                    ) : (
                      <span style={{ color: "#0f766e", fontWeight: 800, fontSize: 13 }}>
                        ↳ DOWNLINE (L{depth})
                      </span>
                    )}

                    {/* ACTIVE PROSPECTS & ACTIVE CLIENTS REAL-TIME BADGES */}
                    <Link href={`${detailUrl}#active-prospects`} style={{ textDecoration: "none" }} title={`Click to view Active Prospects for ${node.legal_name}`}>
                      {Number(node.active_prospects_count || 0) > 0 ? (
                        <span
                          style={{
                            background: "#e0e7ff",
                            color: "#3730a3",
                            padding: "2px 8px",
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            border: "1px solid #c7d2fe",
                            cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(55,48,163,0.12)",
                          }}
                        >
                          🎯 {node.active_prospects_count} Active {node.active_prospects_count === 1 ? "Prospect" : "Prospects"}
                        </span>
                      ) : (
                        <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                          🎯 0 Prospects
                        </span>
                      )}
                    </Link>

                    <Link href={`${detailUrl}#active-clients`} style={{ textDecoration: "none" }} title={`Click to view Active Clients for ${node.legal_name}`}>
                      {Number(node.active_clients_count ?? 0) > 0 ? (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#166534",
                            padding: "2px 8px",
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            border: "1px solid #bbf7d0",
                            cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(22,101,52,0.12)",
                          }}
                        >
                          💼 {node.active_clients_count ?? 0} Active {Number(node.active_clients_count ?? 0) === 1 ? "Client" : "Clients"}
                        </span>
                      ) : (
                        <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                          💼 0 Clients
                        </span>
                      )}
                    </Link>

                    {hasDownlines && (
                      <span style={{ background: "#ccfbf1", color: "#0f766e", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, border: "1px solid #99f6e4" }}>
                        🌿 {totalNetworkCount} Downline{totalNetworkCount === 1 ? "" : "s"} ({node.downlines.length} Direct)
                      </span>
                    )}

                    {node.is_test === 1 && (
                      <span
                        style={{
                          background: "#fffbeb",
                          color: "#b45309",
                          padding: "2px 8px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          border: "1px solid #fde68a",
                        }}
                      >
                        🧪 TESTER DATA
                      </span>
                    )}

                    {node.has_pending_profile_update === 1 && (
                      <span
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          padding: "2px 8px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        ⏳ PENDING eKYC PROFILE UPDATE
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: depth === 0 ? 18 : 15, margin: "6px 0 2px", color: "#0f172a" }}>
                    {node.legal_name}
                  </h3>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                    {node.email} · <span style={{ textTransform: "capitalize" }}>{node.applicant_type.toLowerCase()}</span>
                  </p>
                </Link>
              )}
            </div>

            {/* APPLICATION & AFFILIATE CODES */}
            <div>
              {isVirtual ? (
                <div>
                  <b style={{ color: "#d97706", fontSize: 14 }}>Code: {node.affiliate_code}</b>
                </div>
              ) : (
                <Link href={detailUrl} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <b style={{ color: "#2563eb", fontSize: 14 }}>{node.application_number}</b>
                  {node.affiliate_code && (
                    <div>
                      <small style={{ color: "#0f766e", fontWeight: 700 }}>Affiliate ID: {node.affiliate_code}</small>
                    </div>
                  )}
                  {node.upline_affiliate_code && (
                    <div>
                      <small style={{ color: "#d97706", fontWeight: 600 }}>Upline Code: {node.upline_affiliate_code}</small>
                    </div>
                  )}
                </Link>
              )}
            </div>

            {/* MARKET FOCUS */}
            <div>
              {!isVirtual && (
                <Link href={detailUrl} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{node.market_focus}</span>
                </Link>
              )}
            </div>

            {/* SUBMITTED DATE */}
            <div>
              {!isVirtual && (
                <Link href={detailUrl} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <span style={{ fontSize: 13, color: "#475569" }}>
                    {new Date(node.submitted_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                  </span>
                </Link>
              )}
            </div>

            {/* STATUS BADGE */}
            <div>
              {isVirtual ? (
                <span
                  className="badge"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#fef3c7",
                    color: "#92400e",
                    border: "1px solid #fde68a",
                  }}
                >
                  UPLINE GROUP
                </span>
              ) : (
                <Link href={detailUrl} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <span
                    className="badge"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background:
                        node.status === "SUBMITTED"
                          ? "#dbeafe"
                          : node.status === "UNDER_REVIEW"
                          ? "#e0e7ff"
                          : node.status === "CORRECTION_REQUIRED" || node.status === "INFORMATION_REQUIRED"
                          ? "#fef3c7"
                          : node.status === "PENDING_MANAGEMENT_APPROVAL"
                          ? "#ede9fe"
                          : node.status === "APPROVED"
                          ? "#dcfce7"
                          : node.status === "SUSPENDED"
                          ? "#ffedd5"
                          : node.status === "REJECTED"
                          ? "#ffe4e6"
                          : node.status === "RETRACTED"
                          ? "#fee2e2"
                          : node.status === "RETRACTION_ACKNOWLEDGED"
                          ? "#f1f5f9"
                          : undefined,
                      color:
                        node.status === "SUBMITTED"
                          ? "#1e40af"
                          : node.status === "UNDER_REVIEW"
                          ? "#3730a3"
                          : node.status === "CORRECTION_REQUIRED" || node.status === "INFORMATION_REQUIRED"
                          ? "#92400e"
                          : node.status === "PENDING_MANAGEMENT_APPROVAL"
                          ? "#5b21b6"
                          : node.status === "APPROVED"
                          ? "#166534"
                          : node.status === "SUSPENDED"
                          ? "#c2410c"
                          : node.status === "REJECTED"
                          ? "#9f1239"
                          : node.status === "RETRACTED"
                          ? "#991b1b"
                          : node.status === "RETRACTION_ACKNOWLEDGED"
                          ? "#475569"
                          : undefined,
                      border:
                        node.status === "SUBMITTED"
                          ? "1px solid #bfdbfe"
                          : node.status === "UNDER_REVIEW"
                          ? "1px solid #c7d2fe"
                          : node.status === "CORRECTION_REQUIRED" || node.status === "INFORMATION_REQUIRED"
                          ? "1px solid #fde68a"
                          : node.status === "PENDING_MANAGEMENT_APPROVAL"
                          ? "1px solid #ddd6fe"
                          : node.status === "APPROVED"
                          ? "1px solid #bbf7d0"
                          : node.status === "SUSPENDED"
                          ? "1px solid #fed7aa"
                          : node.status === "REJECTED"
                          ? "1px solid #fecdd3"
                          : node.status === "RETRACTED"
                          ? "1px solid #fca5a5"
                          : node.status === "RETRACTION_ACKNOWLEDGED"
                          ? "1px solid #cbd5e1"
                          : undefined,
                    }}
                  >
                    {node.status.replaceAll("_", " ")}
                  </span>
                </Link>
              )}
            </div>

            {/* ACTIONS */}
            <div>
              {!isVirtual && (
                <div className="row-actions" style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
                  <ToggleTestModeButton entityType="affiliate" entityId={node.id} isTest={node.is_test} size="sm" />
                  <Link
                    className="button secondary"
                    style={{ padding: "5px 12px", fontSize: 12, whiteSpace: "nowrap" }}
                    href={detailUrl}
                  >
                    Review / Detail
                  </Link>
                  <form
                    action={`/foliodesk/api/admin/applications/${node.id}`}
                    method="post"
                    style={{ display: "inline-flex", gap: 4 }}
                    onSubmit={() => setSubmittingId(node.id)}
                  >
                    <fieldset
                      disabled={submittingId === node.id}
                      style={{ display: "inline-flex", gap: 4, border: "none", margin: 0, padding: 0, opacity: submittingId === node.id ? 0.6 : 1 }}
                    >
                    {node.status === "RETRACTED" && (
                      <button
                        name="decision"
                        value="RETRACTION_ACKNOWLEDGED"
                        title="Acknowledge affiliate retraction"
                        style={{ background: "#475569", color: "#fff", borderColor: "#334155" }}
                      >
                        Acknowledge
                      </button>
                    )}

                    {node.status === "PENDING_MANAGEMENT_APPROVAL" && (
                      <span style={{ fontSize: 12, color: "#5b21b6", fontWeight: 600, padding: "4px 8px" }}>
                        Awaiting Management decision
                      </span>
                    )}

                    {node.status !== "APPROVED" &&
                      node.status !== "TERMINATED" &&
                      node.status !== "RETRACTED" &&
                      node.status !== "RETRACTION_ACKNOWLEDGED" &&
                      node.status !== "PENDING_MANAGEMENT_APPROVAL" && (
                        <button className="approve" name="decision" value="APPROVED" title={node.status === "SUSPENDED" ? "Reactivate affiliate" : "Submit for Management approval"}>
                          {node.status === "SUSPENDED" ? "Reactivate" : "Submit for Approval"}
                        </button>
                      )}

                    {node.status === "APPROVED" && (
                      <button name="decision" value="SUSPENDED" title="Suspend affiliate">
                        Suspend
                      </button>
                    )}

                    {(node.status === "APPROVED" || node.status === "SUSPENDED") && (
                      <button name="decision" value="TERMINATED" title="Terminate affiliate">
                        Terminate
                      </button>
                    )}

                    {["SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUIRED", "CORRECTION_REQUIRED"].includes(node.status) && (
                      <button name="decision" value="REJECTED" title="Reject application">
                        Reject
                      </button>
                    )}
                    </fieldset>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DOWNLINES LIST (Rendered hierarchically under this Upline) */}
        {hasDownlines && (
          <div
            style={{
              marginLeft: 28,
              paddingLeft: 20,
              borderLeft: "3px dashed #0f766e",
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f766e", letterSpacing: "1px", padding: "6px 0 2px" }}>
              ▼ DOWNLINES OF {node.legal_name.toUpperCase()} ({node.downlines.length} Direct)
            </div>
            {node.downlines.map((child) => renderAffiliateNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 28 }}>
        <div className="stat">
          <small>Total Applications</small>
          <strong>{initialApps.length}</strong>
        </div>
        <div className="stat">
          <small>Upline Networks</small>
          <strong>{fullTree.length}</strong>
        </div>
        <div className="stat">
          <small>Downlines</small>
          <strong style={{ color: "#0f766e" }}>{downlineCount}</strong>
        </div>
        <Link href="/admin/deals" style={{ textDecoration: "none" }} title="Click to view all Sales Funnel Deals & Prospects">
          <div className="stat" style={{ border: "1.5px solid #c7d2fe", background: "#e0e7ff", cursor: "pointer" }}>
            <small style={{ color: "#3730a3", fontWeight: 700 }}>Active Prospects</small>
            <strong style={{ color: "#312e81" }}>🎯 {totalActiveProspects}</strong>
          </div>
        </Link>
        <Link href="/admin/invoices" style={{ textDecoration: "none" }} title="Click to view all Tax Invoices & Active Paid Clients">
          <div className="stat" style={{ border: "1.5px solid #bbf7d0", background: "#dcfce7", cursor: "pointer" }}>
            <small style={{ color: "#166534", fontWeight: 700 }}>Active Clients (Paid)</small>
            <strong style={{ color: "#14532d" }}>💼 {totalActiveClients}</strong>
          </div>
        </Link>
        <div className="stat" style={{ border: count("SUBMITTED") > 0 ? "1.5px solid #fde68a" : undefined, background: count("SUBMITTED") > 0 ? "#fef3c7" : undefined }}>
          <small style={{ color: count("SUBMITTED") > 0 ? "#92400e" : undefined, fontWeight: 700 }}>Applications Awaiting Review</small>
          <strong style={{ color: count("SUBMITTED") > 0 ? "#b45309" : undefined }}>⏳ {count("SUBMITTED")}</strong>
        </div>
        <div className="stat" style={{ border: pendingProfileUpdatesCount > 0 ? "2px solid #3b82f6" : undefined, background: pendingProfileUpdatesCount > 0 ? "#eff6ff" : undefined }}>
          <small style={{ color: pendingProfileUpdatesCount > 0 ? "#1d4ed8" : undefined, fontWeight: pendingProfileUpdatesCount > 0 ? 700 : undefined }}>Pending eKYC Updates</small>
          <strong style={{ color: pendingProfileUpdatesCount > 0 ? "#1e40af" : undefined }}>{pendingProfileUpdatesCount}</strong>
        </div>
        <div className="stat">
          <small>Approved</small>
          <strong>{count("APPROVED")}</strong>
        </div>
      </div>

      {/* UNIVERSAL SEARCH BOX */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px 20px",
          borderRadius: 12,
          border: "1.5px solid #cbd5e1",
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all applications, legal names, emails, affiliate IDs, upline codes, locations, statuses..."
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
                  padding: 4,
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {searchQuery.trim() && (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#475569" }}>
            <span>
              Showing <b>{matchingAppCount}</b> matching application{matchingAppCount === 1 ? "" : "s"} across <b>{filteredTree.length}</b> network{filteredTree.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}
            >
              Reset / View All
            </button>
          </div>
        )}
      </div>

      {/* UPLINE GROUPS & DOWNLINES HIERARCHICAL LIST */}
      <div>
        {filteredTree.length > 0 ? (
          filteredTree.map((uplineNode) => renderAffiliateNode(uplineNode, 0))
        ) : (
          <div className="admin-card empty" style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🔍</span>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>No affiliate applications match &quot;{searchQuery}&quot;.</p>
            <button
              type="button"
              className="button secondary"
              style={{ marginTop: 14 }}
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </>
  );
}
