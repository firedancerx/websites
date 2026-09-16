import { redirect } from "next/navigation";
import { requireManagement } from "../../../lib/auth";
import { db } from "../../../lib/db";
import ManagementNav from "../ManagementNav";
import ManagementQueueView, { type QueueItem } from "./ManagementQueueView";

// T-405 (plan §7.5): unified Management inbox. All four decide endpoints
// (T-401..T-404) redirect back to this page on success or error. Queries
// every PENDING maker_checker_requests row, then batch-enriches each group
// by request_type/entity_type with just enough context (deal, affiliate,
// amounts) for Management to make an informed decision without re-deriving
// anything the Admin already submitted.

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Management | Approval Queue",
  robots: { index: false, follow: false },
};

export default async function ManagementQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const management = await requireManagement();
  if (!management) redirect("/login");

  const q = await searchParams;

  const [pending] = await db().execute<any[]>(
    `SELECT mcr.*, u.full_name AS submitter_name
     FROM maker_checker_requests mcr
     JOIN users u ON u.id = mcr.submitted_by
     WHERE mcr.status = 'PENDING'
     ORDER BY mcr.submitted_at ASC`
  );

  const items: QueueItem[] = [];

  // --- COLLECTION_APPROVAL ---
  const collectionIds = pending.filter((r) => r.request_type === "COLLECTION_APPROVAL").map((r) => Number(r.entity_id));
  const collectionsById = new Map<number, any>();
  if (collectionIds.length) {
    const [rows] = await db().execute<any[]>(
      `SELECT dc.id, dc.invoice_number, dc.collected_amount_myr, dc.collection_date,
              dp.deal_code, dp.customer_name, a.legal_name AS affiliate_legal_name, a.affiliate_code
       FROM deal_collections dc
       JOIN deal_pipeline dp ON dp.id = dc.deal_id
       JOIN affiliate_applications a ON a.id = dp.affiliate_id
       WHERE dc.id IN (${collectionIds.map(() => "?").join(",")})`,
      collectionIds
    );
    for (const r of rows) collectionsById.set(Number(r.id), r);
  }

  // --- APPLICATION_APPROVAL ---
  const applicationIds = pending.filter((r) => r.request_type === "APPLICATION_APPROVAL").map((r) => Number(r.entity_id));
  const applicationsById = new Map<number, any>();
  if (applicationIds.length) {
    const [rows] = await db().execute<any[]>(
      `SELECT id, application_number, legal_name, applicant_type, country_code, market_focus, affiliate_code
       FROM affiliate_applications WHERE id IN (${applicationIds.map(() => "?").join(",")})`,
      applicationIds
    );
    for (const r of rows) applicationsById.set(Number(r.id), r);
  }

  // --- CLOSURE_APPEAL_ADJUDICATION ---
  const dealIds = pending.filter((r) => r.request_type === "CLOSURE_APPEAL_ADJUDICATION").map((r) => Number(r.entity_id));
  const dealsById = new Map<number, any>();
  if (dealIds.length) {
    const [rows] = await db().execute<any[]>(
      `SELECT dp.id, dp.deal_code, dp.customer_name, dp.status_before_force_closure, dp.force_closed_reason,
              dp.appeal_reason, a.legal_name AS affiliate_legal_name, a.affiliate_code
       FROM deal_pipeline dp
       JOIN affiliate_applications a ON a.id = dp.affiliate_id
       WHERE dp.id IN (${dealIds.map(() => "?").join(",")})`,
      dealIds
    );
    for (const r of rows) dealsById.set(Number(r.id), r);
  }

  // --- PAYOUT_DISBURSEMENT: single (entity_type='payment_advices') and batch (entity_type='affiliate_batch') ---
  const payoutRequests = pending.filter((r) => r.request_type === "PAYOUT_DISBURSEMENT");
  const singleAdviceIds = payoutRequests.filter((r) => r.entity_type === "payment_advices").map((r) => Number(r.entity_id));
  const advicesById = new Map<number, any>();
  if (singleAdviceIds.length) {
    const [rows] = await db().execute<any[]>(
      `SELECT pa.id, pa.advice_number, pa.commission_amount_myr, pa.beneficiary_type,
              dp.deal_code, dp.customer_name, a.legal_name AS affiliate_legal_name, a.affiliate_code
       FROM payment_advices pa
       JOIN deal_pipeline dp ON dp.id = pa.deal_id
       JOIN affiliate_applications a ON a.id = pa.beneficiary_affiliate_id
       WHERE pa.id IN (${singleAdviceIds.map(() => "?").join(",")})`,
      singleAdviceIds
    );
    for (const r of rows) advicesById.set(Number(r.id), r);
  }
  const batchAffiliateIds = payoutRequests.filter((r) => r.entity_type === "affiliate_batch").map((r) => Number(r.entity_id));
  const affiliatesById = new Map<number, any>();
  if (batchAffiliateIds.length) {
    const [rows] = await db().execute<any[]>(
      `SELECT id, legal_name, affiliate_code FROM affiliate_applications WHERE id IN (${batchAffiliateIds.map(() => "?").join(",")})`,
      batchAffiliateIds
    );
    for (const r of rows) affiliatesById.set(Number(r.id), r);
  }

  for (const r of pending) {
    const payload = typeof r.action_payload === "string" ? JSON.parse(r.action_payload) : r.action_payload;
    const base = {
      mcId: Number(r.id),
      requestType: r.request_type as QueueItem["requestType"],
      entityType: r.entity_type as string,
      entityId: Number(r.entity_id),
      submittedAt: r.submitted_at,
      submitterName: r.submitter_name as string,
      submittedById: Number(r.submitted_by),
    };

    if (r.request_type === "COLLECTION_APPROVAL") {
      const c = collectionsById.get(Number(r.entity_id));
      items.push({
        ...base,
        title: `Collection ${c?.invoice_number ?? `#${r.entity_id}`}`,
        subtitle: `${c?.deal_code ?? "Deal"} · ${c?.customer_name ?? ""} · ${c?.affiliate_legal_name ?? ""} (${c?.affiliate_code ?? ""})`,
        amount: c ? Number(c.collected_amount_myr) : undefined,
        meta: [
          { label: "Collection Date", value: c?.collection_date ? String(c.collection_date).slice(0, 10) : "-" },
          { label: "Remarks", value: payload?.approvalRemarks ?? "-" },
        ],
        decideAction: `/foliodesk/api/management/collections/${r.entity_id}/decide`,
        decideField: "form",
      });
    } else if (r.request_type === "PAYOUT_DISBURSEMENT") {
      if (r.entity_type === "payment_advices") {
        const a = advicesById.get(Number(r.entity_id));
        items.push({
          ...base,
          title: `Payment Advice ${a?.advice_number ?? `#${r.entity_id}`}`,
          subtitle: `${a?.deal_code ?? "Deal"} · ${a?.customer_name ?? ""} · ${a?.affiliate_legal_name ?? ""} (${a?.affiliate_code ?? ""}) · ${a?.beneficiary_type ?? ""}`,
          amount: a ? Number(a.commission_amount_myr) : undefined,
          meta: [
            { label: "Bank Tx Ref", value: payload?.manualBankTxRef ?? "-" },
            { label: "Notes", value: payload?.payoutNotes ?? "-" },
          ],
          decideAction: `/foliodesk/api/management/payouts/decide`,
          decideField: "requestId",
        });
      } else {
        const af = affiliatesById.get(Number(r.entity_id));
        const adviceIds: number[] = payload?.adviceIds ?? [];
        items.push({
          ...base,
          title: `Consolidated Payout Batch (${adviceIds.length} advice${adviceIds.length === 1 ? "" : "s"})`,
          subtitle: `${af?.legal_name ?? ""} (${af?.affiliate_code ?? ""})`,
          meta: [
            { label: "Bank Tx Ref", value: payload?.manualBankTxRef ?? "-" },
            { label: "Bank", value: payload?.bankName ?? "-" },
            { label: "Account No.", value: payload?.bankAccountNumber ?? "-" },
            { label: "Notes", value: payload?.payoutNotes ?? "-" },
          ],
          decideAction: `/foliodesk/api/management/payouts/decide`,
          decideField: "requestId",
        });
      }
    } else if (r.request_type === "APPLICATION_APPROVAL") {
      const app = applicationsById.get(Number(r.entity_id));
      items.push({
        ...base,
        title: `Affiliate Application ${app?.application_number ?? `#${r.entity_id}`}`,
        subtitle: `${app?.legal_name ?? ""} · ${app?.applicant_type ?? ""} · ${app?.country_code ?? ""} · ${app?.market_focus ?? ""}`,
        meta: [
          { label: "Proposed Affiliate Code", value: app?.affiliate_code ?? "(assigned on approval)" },
          { label: "Admin Note", value: payload?.decisionNote ?? "-" },
        ],
        decideAction: `/foliodesk/api/management/applications/${r.entity_id}/decide`,
        decideField: "form",
      });
    } else if (r.request_type === "CLOSURE_APPEAL_ADJUDICATION") {
      const d = dealsById.get(Number(r.entity_id));
      items.push({
        ...base,
        title: `Force-Closure Appeal — ${d?.deal_code ?? `#${r.entity_id}`}`,
        subtitle: `${d?.customer_name ?? ""} · ${d?.affiliate_legal_name ?? ""} (${d?.affiliate_code ?? ""})`,
        meta: [
          {
            label: "Admin Recommendation",
            value: payload?.isApproved ? `Approve (+${payload?.daysExtended ?? 0} day(s))` : "Reject (remain force-closed)",
          },
          { label: "Would Restore To", value: d?.status_before_force_closure ?? "-" },
          { label: "Force-Closure Reason", value: d?.force_closed_reason ?? "-" },
          { label: "Affiliate's Appeal", value: d?.appeal_reason ?? "-" },
          { label: "Admin Notes", value: payload?.notes ?? "-" },
        ],
        decideAction: `/foliodesk/api/management/deals/${r.entity_id}/closure/decide`,
        decideField: "form",
      });
    }
  }

  return (
    <section className="admin-wrap" style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div className="admin-head">
        <div>
          <div className="eyebrow">FOLIODESK PROGRAMME MANAGEMENT</div>
          <h1>Approval Queue</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
            Every collection approval, payout disbursement, affiliate application approval, and
            force-closure appeal adjudication submitted by an Admin waits here for Management
            sign-off. You cannot decide on a request you submitted yourself.
          </p>
        </div>
      </div>

      <ManagementNav />

      {q.success && (
        <div className="notice" style={{ background: "rgba(16,185,129,0.1)", borderColor: "#10b981", color: "#065f46", marginBottom: 20 }}>
          ✓ {q.success}
        </div>
      )}
      {q.error && <div className="notice error" style={{ marginBottom: 20 }}>⚠️ {q.error}</div>}

      <ManagementQueueView items={JSON.parse(JSON.stringify(items))} currentManagementId={management.id} />
    </section>
  );
}
