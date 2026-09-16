import { randomBytes } from "node:crypto";
import { db } from "./db";
import { getCommissionSettings } from "./settings";

export type FunnelStatus =
  | "LEAD_SUBMITTED"
  | "QUALIFIED"
  | "PROPOSAL_SENT"
  | "SUSPENDED_EFFORT"
  | "ABORTED"
  | "CONTRACT_SIGNED"
  | "INVOICED"
  | "PARTIAL_COLLECTED"
  | "FULLY_COLLECTED"
  | "UNCOLLECTIBLE";

export type CollectionApprovalStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type StepReviewStatus = "PENDING_REVIEW" | "ACKNOWLEDGED" | "RETURNED_FOR_REVIEW";
export type AppealStatus = "NONE" | "APPEAL_SUBMITTED" | "APPEAL_APPROVED" | "APPEAL_REJECTED";

export interface DealRecord {
  id: number;
  affiliate_id: number;
  deal_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  package_name: string;
  package_count: number;
  contract_value_myr: number;
  extension_days_granted: number;
  is_force_closed: number;
  force_closed_at: string | null;
  force_closed_reason: string | null;
  appeal_status: AppealStatus;
  appeal_reason: string | null;
  appeal_submitted_at: string | null;
  appeal_adjudicated_at: string | null;
  appeal_adjudication_notes: string | null;
  status: FunnelStatus;
  status_note: string | null;
  suspended_reason: string | null;
  aborted_reason: string | null;
  signed_date: string | null;
  invoice_number: string | null;
  invoice_target?: "PROSPECT" | "AFFILIATE";
  invoiced_at: string | null;
  is_test?: number;
  created_at: string;
  updated_at: string;
  // Join fields
  affiliate_legal_name?: string;
  affiliate_code?: string;
  affiliate_email?: string;
  total_collected_myr?: number;
  pending_steps_count?: number;
}

export interface FunnelStepRecord {
  id: number;
  deal_id: number;
  from_stage: string | null;
  to_stage: string;
  step_title: string;
  affiliate_notes: string;
  submitted_by_user_id: number;
  submitted_at: string;
  admin_review_status: StepReviewStatus;
  admin_remarks: string | null;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  is_immutable: number;
  is_test?: number;
  created_at: string;
  updated_at: string;
  // Joins
  submitter_name?: string;
  reviewer_name?: string;
}

export interface ClosureLogRecord {
  id: number;
  deal_id: number;
  action_type: "FORCED_CLOSURE" | "APPEAL_SUBMITTED" | "EXTENSION_GRANTED" | "APPEAL_REJECTED";
  days_extended: number;
  action_notes: string;
  performed_by_user_id: number;
  created_at: string;
  performer_name?: string;
}

export interface CollectionRecord {
  id: number;
  deal_id: number;
  invoice_number: string;
  invoice_total_myr: number;
  collected_amount_myr: number;
  bank_receipt_ref: string;
  proof_media_path: string | null;
  locked_direct_rate_pct: number;
  locked_upline_l1_rate_pct: number;
  locked_upline_l2_rate_pct: number;
  approval_status: CollectionApprovalStatus;
  approved_by: number | null;
  approved_at: string | null;
  approval_remarks: string | null;
  is_immutable: number;
  collection_date: string;
  is_final_collection: number;
  notes: string | null;
  is_test?: number;
  created_at: string;
  // Join fields
  deal_code?: string;
  customer_name?: string;
  affiliate_legal_name?: string;
  affiliate_code?: string;
  approver_name?: string;
  // T-401 (plan §7.3(1)): status of this collection's maker-checker request, if any.
  mc_request_status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | null;
}

export interface PayoutBatchRecord {
  id: number;
  batch_code: string;
  beneficiary_affiliate_id: number;
  total_amount_myr: number;
  advice_count: number;
  manual_bank_tx_ref: string;
  bank_name: string | null;
  bank_account_number: string | null;
  payout_notes: string | null;
  disbursed_by: number;
  disbursed_at: string;
  is_test?: number;
  created_at: string;
  // Joins
  beneficiary_legal_name?: string;
  beneficiary_affiliate_code?: string;
  beneficiary_phone?: string;
  disburser_name?: string;
}

export function generateDealCode(): string {
  const hex = randomBytes(3).toString("hex").toUpperCase();
  const year = new Date().getFullYear();
  return `DEAL-${year}-${hex}`;
}

export function generateAdviceNumber(): string {
  const hex = randomBytes(3).toString("hex").toUpperCase();
  const year = new Date().getFullYear();
  return `ADV-${year}-${hex}`;
}

export function generateBatchCode(): string {
  const hex = randomBytes(3).toString("hex").toUpperCase();
  const year = new Date().getFullYear();
  return `DISB-${year}-${hex}`;
}

/**
 * Check Prospect Exclusivity Rule:
 * No affiliate can register the same prospect (by full company name)
 * while it is actively logged by another affiliate until closed/stopped.
 */
export async function checkProspectExclusivity(
  customerName: string,
  excludeDealId?: number
): Promise<{ isAvailable: boolean; activeDeal: any | null }> {
  const trimmed = customerName.trim();
  let query = `
    SELECT dp.id, dp.deal_code, dp.customer_name, dp.status, dp.created_at, a.legal_name AS affiliate_legal_name
    FROM deal_pipeline dp
    JOIN affiliate_applications a ON a.id = dp.affiliate_id
    WHERE LOWER(TRIM(dp.customer_name)) = LOWER(?)
      AND dp.status NOT IN ('ABORTED', 'UNCOLLECTIBLE')
      AND (dp.is_force_closed = 0 OR dp.appeal_status = 'APPEAL_SUBMITTED')
  `;
  const params: any[] = [trimmed];

  if (excludeDealId) {
    query += " AND dp.id != ?";
    params.push(excludeDealId);
  }

  const [rows] = await db().execute<any[]>(query, params);
  if (rows.length > 0) {
    return { isAvailable: false, activeDeal: rows[0] };
  }
  return { isAvailable: true, activeDeal: null };
}

/**
 * Calculate Closure Deadline & Overdue Status:
 */
export function calculateClosureDeadline(
  createdAt: string | Date,
  closurePeriodDays: number = 90,
  extensionDays: number = 0
): {
  deadlineDate: Date;
  daysRemaining: number;
  isOverdue: boolean;
  totalDaysAllowed: number;
} {
  const start = new Date(createdAt);
  const totalDays = closurePeriodDays + extensionDays;
  const deadline = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
  const now = new Date();

  const diffMs = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  return {
    deadlineDate: deadline,
    daysRemaining,
    isOverdue,
    totalDaysAllowed: totalDays,
  };
}

export async function findUplineChain(
  directAffiliateId: number,
  executor: Pick<ReturnType<typeof db>, "execute"> = db()
): Promise<{
  directAffiliate: any;
  uplineL1: any | null;
  uplineL2: any | null;
}> {
  // executor allows callers that are already inside a DB transaction (e.g.
  // approveDealCollection(), see F-01 fix) to pass their transaction
  // connection so these reads participate in the same transaction, instead
  // of implicitly going through the pool via db().
  const [directRows] = await executor.execute<any[]>(
    "SELECT id, user_id, legal_name, affiliate_code, upline_affiliate_code, status FROM affiliate_applications WHERE id=? LIMIT 1",
    [directAffiliateId]
  );
  const directAffiliate = directRows[0] || null;
  if (!directAffiliate) {
    return { directAffiliate: null, uplineL1: null, uplineL2: null };
  }

  let uplineL1 = null;
  let uplineL2 = null;

  if (directAffiliate.upline_affiliate_code) {
    const [l1Rows] = await executor.execute<any[]>(
      "SELECT id, user_id, legal_name, affiliate_code, upline_affiliate_code, status FROM affiliate_applications WHERE affiliate_code=? LIMIT 1",
      [directAffiliate.upline_affiliate_code.trim().toUpperCase()]
    );
    uplineL1 = l1Rows[0] || null;

    if (uplineL1 && uplineL1.upline_affiliate_code) {
      const [l2Rows] = await executor.execute<any[]>(
        "SELECT id, user_id, legal_name, affiliate_code, upline_affiliate_code, status FROM affiliate_applications WHERE affiliate_code=? LIMIT 1",
        [uplineL1.upline_affiliate_code.trim().toUpperCase()]
      );
      uplineL2 = l2Rows[0] || null;
    }
  }

  return { directAffiliate, uplineL1, uplineL2 };
}

/**
 * Log a new sales funnel step submitted by an affiliate.
 */
export async function logFunnelStep({
  dealId,
  fromStage,
  toStage,
  stepTitle,
  affiliateNotes,
  submittedByUserId,
  isTest,
}: {
  dealId: number;
  fromStage: string | null;
  toStage: string;
  stepTitle: string;
  affiliateNotes: string;
  submittedByUserId: number;
  isTest?: number | boolean;
}): Promise<{ stepId: number }> {
  let isTestVal = isTest !== undefined ? (isTest ? 1 : 0) : 1;
  const [dealRows] = await db().execute<any[]>(
    "SELECT is_test FROM deal_pipeline WHERE id=? LIMIT 1",
    [dealId]
  );
  if (dealRows[0]?.is_test !== undefined) {
    isTestVal = dealRows[0].is_test;
  }

  const [res]: any = await db().execute(
    `INSERT INTO deal_funnel_steps 
      (deal_id, from_stage, to_stage, step_title, affiliate_notes, submitted_by_user_id, admin_review_status, is_immutable, is_test)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING_REVIEW', 1, ?)`,
    [dealId, fromStage || null, toStage, stepTitle, affiliateNotes, submittedByUserId, isTestVal]
  );

  // Update deal status note
  await db().execute(
    "UPDATE deal_pipeline SET status_note=? WHERE id=?",
    [`${stepTitle}: ${affiliateNotes.slice(0, 120)}`, dealId]
  );

  return { stepId: res.insertId };
}

/**
 * Review a sales funnel step (Admin Acknowledge or Return for Review).
 */
export async function reviewFunnelStep({
  stepId,
  reviewStatus,
  adminRemarks,
  reviewerUserId,
}: {
  stepId: number;
  reviewStatus: "ACKNOWLEDGED" | "RETURNED_FOR_REVIEW";
  adminRemarks?: string;
  reviewerUserId: number;
}): Promise<{ dealId: number; targetStage: string }> {
  const [stepRows] = await db().execute<any[]>(
    "SELECT * FROM deal_funnel_steps WHERE id=? LIMIT 1",
    [stepId]
  );
  const step = stepRows[0];
  if (!step) throw new Error("Funnel step not found");

  await db().execute(
    `UPDATE deal_funnel_steps 
     SET admin_review_status=?, 
         admin_remarks=?, 
         reviewed_by_user_id=?, 
         reviewed_at=CURRENT_TIMESTAMP 
     WHERE id=?`,
    [reviewStatus, adminRemarks || null, reviewerUserId, stepId]
  );

  // If acknowledged, update the main deal status to the target stage
  if (reviewStatus === "ACKNOWLEDGED") {
    await db().execute(
      "UPDATE deal_pipeline SET status=? WHERE id=?",
      [step.to_stage, step.deal_id]
    );
  }

  return { dealId: step.deal_id, targetStage: step.to_stage };
}

/**
 * Force Close an Overdue Deal by Admin:
 */
export async function forceCloseDeal({
  dealId,
  reason,
  adminUserId,
}: {
  dealId: number;
  reason: string;
  adminUserId: number;
}): Promise<void> {
  // F-08 fix (plan §7.8, §2, §6.1): snapshot the deal's actual status before it
  // is force-closed, so a subsequently-approved appeal can restore the real
  // prior stage instead of a hardcoded one (see adjudicateDealAppeal() below).
  const [dealRows] = await db().execute<any[]>(
    "SELECT status FROM deal_pipeline WHERE id=? LIMIT 1",
    [dealId]
  );
  const priorStatus = dealRows[0]?.status ?? null;

  await db().execute(
    `UPDATE deal_pipeline 
     SET is_force_closed=1, 
         force_closed_at=CURRENT_TIMESTAMP, 
         force_closed_reason=?, 
         status_before_force_closure=?, 
         status='ABORTED' 
     WHERE id=?`,
    [reason, priorStatus, dealId]
  );

  await db().execute(
    `INSERT INTO deal_closure_logs 
      (deal_id, action_type, days_extended, action_notes, performed_by_user_id)
     VALUES (?, 'FORCED_CLOSURE', 0, ?, ?)`,
    [dealId, reason, adminUserId]
  );
}

/**
 * Submit an Appeal for Extension by Affiliate:
 */
export async function submitDealAppeal({
  dealId,
  reason,
  affiliateUserId,
}: {
  dealId: number;
  reason: string;
  affiliateUserId: number;
}): Promise<void> {
  await db().execute(
    `UPDATE deal_pipeline 
     SET appeal_status='APPEAL_SUBMITTED', 
         appeal_reason=?, 
         appeal_submitted_at=CURRENT_TIMESTAMP 
     WHERE id=?`,
    [reason, dealId]
  );

  await db().execute(
    `INSERT INTO deal_closure_logs 
      (deal_id, action_type, days_extended, action_notes, performed_by_user_id)
     VALUES (?, 'APPEAL_SUBMITTED', 0, ?, ?)`,
    [dealId, reason, affiliateUserId]
  );
}

/**
 * Adjudicate an Appeal by Admin:
 */
export async function adjudicateDealAppeal({
  dealId,
  isApproved,
  daysExtended,
  notes,
  adminUserId,
}: {
  dealId: number;
  isApproved: boolean;
  daysExtended: number;
  notes: string;
  adminUserId: number;
}): Promise<void> {
  if (isApproved) {
    // F-08 fix (plan §7.8, §2, §6.1): restore the deal's actual pre-closure
    // stage (captured by forceCloseDeal() into status_before_force_closure)
    // instead of hardcoding 'PROPOSAL_SENT'. A deal force-closed at
    // CONTRACT_SIGNED must return to CONTRACT_SIGNED on a successful appeal,
    // not be silently demoted. Falls back to 'PROPOSAL_SENT' only if no prior
    // status was ever recorded (e.g. legacy rows predating this column).
    const [dealRows] = await db().execute<any[]>(
      "SELECT status_before_force_closure FROM deal_pipeline WHERE id=? LIMIT 1",
      [dealId]
    );
    const restoredStatus = dealRows[0]?.status_before_force_closure || "PROPOSAL_SENT";

    await db().execute(
      `UPDATE deal_pipeline 
       SET appeal_status='APPEAL_APPROVED', 
           appeal_adjudicated_at=CURRENT_TIMESTAMP, 
           appeal_adjudication_notes=?, 
           is_force_closed=0, 
           status=?, 
           status_before_force_closure=NULL, 
           extension_days_granted = extension_days_granted + ? 
       WHERE id=?`,
      [notes, restoredStatus, daysExtended, dealId]
    );

    await db().execute(
      `INSERT INTO deal_closure_logs 
        (deal_id, action_type, days_extended, action_notes, performed_by_user_id)
       VALUES (?, 'EXTENSION_GRANTED', ?, ?, ?)`,
      [dealId, daysExtended, `Appeal Approved (restored to ${restoredStatus}): ${notes}`, adminUserId]
    );
  } else {
    await db().execute(
      `UPDATE deal_pipeline 
       SET appeal_status='APPEAL_REJECTED', 
           appeal_adjudicated_at=CURRENT_TIMESTAMP, 
           appeal_adjudication_notes=? 
       WHERE id=?`,
      [notes, dealId]
    );

    await db().execute(
      `INSERT INTO deal_closure_logs 
        (deal_id, action_type, days_extended, action_notes, performed_by_user_id)
       VALUES (?, 'APPEAL_REJECTED', 0, ?, ?)`,
      [dealId, `Appeal Rejected: ${notes}`, adminUserId]
    );
  }
}

/**
 * Direct Extension by Admin (Without Appeal):
 */
export async function extendDealDirectly({
  dealId,
  daysExtended,
  notes,
  adminUserId,
}: {
  dealId: number;
  daysExtended: number;
  notes: string;
  adminUserId: number;
}): Promise<void> {
  await db().execute(
    `UPDATE deal_pipeline 
     SET extension_days_granted = extension_days_granted + ?, 
         is_force_closed=0 
     WHERE id=?`,
    [daysExtended, dealId]
  );

  await db().execute(
    `INSERT INTO deal_closure_logs 
      (deal_id, action_type, days_extended, action_notes, performed_by_user_id)
     VALUES (?, 'EXTENSION_GRANTED', ?, ?, ?)`,
    [dealId, daysExtended, notes || "Extended directly by administrator", adminUserId]
  );
}

/**
 * Submit Payment Collection (with snapshot rate locking):
 */
export async function submitDealCollection({
  dealId,
  invoiceNumber,
  invoiceTotalMyr,
  collectedAmountMyr,
  bankReceiptRef,
  proofMediaPath,
  collectionDate,
  isFinalCollection,
  notes,
  isTest,
}: {
  dealId: number;
  invoiceNumber: string;
  invoiceTotalMyr: number;
  collectedAmountMyr: number;
  bankReceiptRef: string;
  proofMediaPath?: string | null;
  collectionDate: string;
  isFinalCollection: boolean;
  notes?: string;
  isTest?: number | boolean;
}): Promise<{ collectionId: number }> {
  const [dealRows] = await db().execute<any[]>(
    "SELECT id, affiliate_id, contract_value_myr, status, invoice_number, is_test FROM deal_pipeline WHERE id=? LIMIT 1",
    [dealId]
  );
  const deal = dealRows[0];
  if (!deal) throw new Error("Deal not found");

  if (!deal.invoice_number) {
    throw new Error("Cannot record collection: An official invoice must be issued first for this deal.");
  }

  if (deal.status === "FULLY_COLLECTED" || deal.status === "CLIENT_ONBOARDED" || deal.status === "CLOSED_WON" || deal.status === "ABORTED") {
    throw new Error(`This deal is already ${deal.status.replaceAll("_", " ")}; no further collections can be recorded.`);
  }

  const [approvedColls] = await db().execute<any[]>(
    "SELECT COALESCE(SUM(collected_amount_myr), 0) as total FROM deal_collections WHERE deal_id = ? AND approval_status = 'APPROVED'",
    [dealId]
  );
  const totalApproved = Number(approvedColls[0]?.total || 0);
  const contractVal = Number(deal.contract_value_myr || 0);
  if (contractVal > 0 && totalApproved >= contractVal) {
    throw new Error(`This deal is already fully collected (RM ${totalApproved.toLocaleString("en-MY", { minimumFractionDigits: 2 })} collected out of RM ${contractVal.toLocaleString("en-MY", { minimumFractionDigits: 2 })} contract value).`);
  }

  const isTestVal = isTest !== undefined ? (isTest ? 1 : 0) : (deal.is_test ?? 1);
  const settings = await getCommissionSettings();

  const [collRes]: any = await db().execute(
    `INSERT INTO deal_collections 
      (deal_id, invoice_number, invoice_total_myr, collected_amount_myr, bank_receipt_ref, proof_media_path,
       locked_direct_rate_pct, locked_upline_l1_rate_pct, locked_upline_l2_rate_pct,
       approval_status, is_immutable, collection_date, is_final_collection, notes, is_test)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', 0, ?, ?, ?, ?)`,
    [
      dealId,
      invoiceNumber,
      invoiceTotalMyr,
      collectedAmountMyr,
      bankReceiptRef,
      proofMediaPath || null,
      settings.directRatePct,
      settings.uplineL1RatePct,
      settings.uplineL2RatePct,
      collectionDate,
      isFinalCollection ? 1 : 0,
      notes || null,
      isTestVal,
    ]
  );

  return { collectionId: collRes.insertId };
}

/**
 * Management Approval on Collection:
 */
export async function approveDealCollection({
  collectionId,
  approverUserId,
  approvalRemarks,
}: {
  collectionId: number;
  approverUserId: number;
  approvalRemarks?: string;
}): Promise<{
  adviceCount: number;
  dealId: number;
  skippedBeneficiaries: {
    beneficiaryType: "DIRECT_AFFILIATE" | "UPLINE_L1" | "UPLINE_L2";
    affiliateId: number;
    affiliateLegalName: string;
    status: string;
    wouldBeAmountMyr: number;
  }[];
}> {
  // F-01 (plan §6.3 / §7.8): this function performs 6+ sequential writes across
  // 5 tables (deal_collections, payment_advices x<=3, deal_pipeline,
  // onboarded_customers, deal_funnel_steps). It must be atomic -- a mid-function
  // failure must not leave partially-created commission records with no rollback
  // path. Wrapped in a single DB transaction, matching the pattern already used
  // correctly in app/api/register/route.ts.
  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();

    const [collRows] = await conn.execute<any[]>(
      "SELECT * FROM deal_collections WHERE id=? LIMIT 1 FOR UPDATE",
      [collectionId]
    );
    const coll = collRows[0];
    if (!coll) throw new Error("Collection record not found");

    if (coll.approval_status === "APPROVED") {
      throw new Error("Collection has already been approved and sealed as immutable.");
    }

    const [dealRows] = await conn.execute<any[]>(
      "SELECT id, affiliate_id, contract_value_myr, status FROM deal_pipeline WHERE id=? LIMIT 1",
      [coll.deal_id]
    );
    const deal = dealRows[0];
    if (!deal) throw new Error("Deal not found");

    await conn.execute(
      `UPDATE deal_collections 
       SET approval_status='APPROVED', 
           approved_by=?, 
           approved_at=CURRENT_TIMESTAMP, 
           approval_remarks=?, 
           is_immutable=1 
       WHERE id=?`,
      [approverUserId, approvalRemarks || "Approved by management", collectionId]
    );

    const { directAffiliate, uplineL1, uplineL2 } = await findUplineChain(deal.affiliate_id, conn);

    let adviceCount = 0;
    const collectedBase = Number(coll.collected_amount_myr);
    const directRate = Number(coll.locked_direct_rate_pct);
    const l1Rate = Number(coll.locked_upline_l1_rate_pct);
    const l2Rate = Number(coll.locked_upline_l2_rate_pct);
    const isTestVal = coll.is_test ?? deal.is_test ?? 1;

    // F-04/F-02 (plan §8 items 2-3, business decision recorded 2026-09-16):
    // vesting model is "snapshot at collection approval" -- commission rights
    // for each beneficiary are determined by that beneficiary's
    // affiliate_applications.status at the exact moment Management approves
    // *this* collection, using an explicit APPROVED allowlist (not a
    // SUSPENDED/TERMINATED/RETRACTED blocklist, so a new future status value
    // fails closed rather than silently accruing commission). A beneficiary
    // who is not APPROVED at this instant gets no payment_advices row for
    // this collection -- nothing to claw back later, nothing silently paid
    // to someone no longer in good standing. Once a payment_advices row is
    // created here it is immutable (is_immutable=1) and stays payable
    // regardless of what happens to that affiliate afterward -- that is the
    // "already vested" case the plan asked this fix to preserve. Every
    // withheld beneficiary is still recorded (skippedBeneficiaries, logged to
    // audit_events below) so the withholding is visible and auditable rather
    // than a silent gap in the commission trail.
    const skippedBeneficiaries: {
      beneficiaryType: "DIRECT_AFFILIATE" | "UPLINE_L1" | "UPLINE_L2";
      affiliateId: number;
      affiliateLegalName: string;
      status: string;
      wouldBeAmountMyr: number;
    }[] = [];

    if (directAffiliate) {
      const directComm = collectedBase * (directRate / 100);
      if (directAffiliate.status === "APPROVED") {
        await conn.execute(
          `INSERT INTO payment_advices 
            (advice_number, collection_id, deal_id, beneficiary_affiliate_id, beneficiary_type, rate_percentage, collection_amount_base_myr, commission_amount_myr, payout_status, is_immutable, is_test)
           VALUES (?, ?, ?, ?, 'DIRECT_AFFILIATE', ?, ?, ?, 'PENDING_DISBURSEMENT', 1, ?)`,
          [
            generateAdviceNumber(),
            collectionId,
            deal.id,
            directAffiliate.id,
            directRate,
            collectedBase,
            directComm,
            isTestVal,
          ]
        );
        adviceCount++;
      } else {
        skippedBeneficiaries.push({
          beneficiaryType: "DIRECT_AFFILIATE",
          affiliateId: directAffiliate.id,
          affiliateLegalName: directAffiliate.legal_name,
          status: directAffiliate.status,
          wouldBeAmountMyr: directComm,
        });
      }
    }

    if (uplineL1) {
      const l1Comm = collectedBase * (l1Rate / 100);
      if (uplineL1.status === "APPROVED") {
        await conn.execute(
          `INSERT INTO payment_advices 
            (advice_number, collection_id, deal_id, beneficiary_affiliate_id, beneficiary_type, rate_percentage, collection_amount_base_myr, commission_amount_myr, payout_status, is_immutable, is_test)
           VALUES (?, ?, ?, ?, 'UPLINE_L1', ?, ?, ?, 'PENDING_DISBURSEMENT', 1, ?)`,
          [
            generateAdviceNumber(),
            collectionId,
            deal.id,
            uplineL1.id,
            l1Rate,
            collectedBase,
            l1Comm,
            isTestVal,
          ]
        );
        adviceCount++;
      } else {
        skippedBeneficiaries.push({
          beneficiaryType: "UPLINE_L1",
          affiliateId: uplineL1.id,
          affiliateLegalName: uplineL1.legal_name,
          status: uplineL1.status,
          wouldBeAmountMyr: l1Comm,
        });
      }
    }

    if (uplineL2) {
      const l2Comm = collectedBase * (l2Rate / 100);
      if (uplineL2.status === "APPROVED") {
        await conn.execute(
          `INSERT INTO payment_advices 
            (advice_number, collection_id, deal_id, beneficiary_affiliate_id, beneficiary_type, rate_percentage, collection_amount_base_myr, commission_amount_myr, payout_status, is_immutable, is_test)
           VALUES (?, ?, ?, ?, 'UPLINE_L2', ?, ?, ?, 'PENDING_DISBURSEMENT', 1, ?)`,
          [
            generateAdviceNumber(),
            collectionId,
            deal.id,
            uplineL2.id,
            l2Rate,
            collectedBase,
            l2Comm,
            isTestVal,
          ]
        );
        adviceCount++;
      } else {
        skippedBeneficiaries.push({
          beneficiaryType: "UPLINE_L2",
          affiliateId: uplineL2.id,
          affiliateLegalName: uplineL2.legal_name,
          status: uplineL2.status,
          wouldBeAmountMyr: l2Comm,
        });
      }
    }

    for (const skipped of skippedBeneficiaries) {
      await conn.execute(
        "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'COMMISSION_WITHHELD_STATUS_VESTING','deal_collections',?,JSON_OBJECT('beneficiaryType',?,'affiliateId',?,'affiliateLegalName',?,'affiliateStatus',?,'wouldBeAmountMyr',?))",
        [
          approverUserId,
          String(collectionId),
          skipped.beneficiaryType,
          String(skipped.affiliateId),
          skipped.affiliateLegalName,
          skipped.status,
          skipped.wouldBeAmountMyr,
        ]
      );
    }

    const [totalCollRows] = await conn.execute<any[]>(
      "SELECT COALESCE(SUM(collected_amount_myr), 0) AS total_collected FROM deal_collections WHERE deal_id=? AND approval_status='APPROVED'",
      [deal.id]
    );
    const totalApproved = parseFloat(totalCollRows[0]?.total_collected || "0");
    const newDealStatus =
      coll.is_final_collection || totalApproved >= Number(deal.contract_value_myr)
        ? "FULLY_COLLECTED"
        : "PARTIAL_COLLECTED";

    await conn.execute(
      "UPDATE deal_pipeline SET status=?, invoice_number=COALESCE(invoice_number, ?) WHERE id=?",
      [newDealStatus, coll.invoice_number, deal.id]
    );

    // Auto-sync into onboarded_customers to ensure active clients reporting is 100% accurate instantly
    const [dealFull] = await conn.execute<any[]>(
      "SELECT * FROM deal_pipeline WHERE id=? LIMIT 1",
      [deal.id]
    );
    const d = dealFull[0];
    if (d) {
      const [custCheck] = await conn.execute<any[]>(
        "SELECT id FROM onboarded_customers WHERE affiliate_id=? AND (customer_email=? OR customer_name=?) LIMIT 1",
        [d.affiliate_id, d.customer_email, d.customer_name]
      );
      if (custCheck.length === 0) {
        await conn.execute(
          `INSERT INTO onboarded_customers (
            affiliate_id, customer_name, customer_email, customer_phone, signed_date,
            package_name, package_count, annual_value_myr, status, is_test
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
          [
            d.affiliate_id,
            d.customer_name,
            d.customer_email,
            d.customer_phone,
            coll.collection_date || d.created_at,
            d.package_name,
            d.package_count || 1,
            d.annual_value_myr || d.package_amount_myr || 0,
            d.is_test || 0,
          ]
        );
      } else {
        await conn.execute(
          "UPDATE onboarded_customers SET status='ACTIVE', is_test=? WHERE id=?",
          [d.is_test || 0, custCheck[0].id]
        );
      }
    }

    // Auto-acknowledge any pending steps and record collection step in funnel history
    await conn.execute(
      `UPDATE deal_funnel_steps 
       SET admin_review_status='ACKNOWLEDGED', 
           admin_remarks=COALESCE(admin_remarks, 'Auto-acknowledged upon management collection approval'), 
           reviewed_by_user_id=?, 
           reviewed_at=CURRENT_TIMESTAMP 
       WHERE deal_id=? AND admin_review_status='PENDING_REVIEW'`,
      [approverUserId, deal.id]
    );

    const [existingCollStep] = await conn.execute<any[]>(
      "SELECT id FROM deal_funnel_steps WHERE deal_id=? AND to_stage=? LIMIT 1",
      [deal.id, newDealStatus]
    );
    if (existingCollStep.length === 0) {
      await conn.execute(
        `INSERT INTO deal_funnel_steps 
          (deal_id, from_stage, to_stage, step_title, affiliate_notes, submitted_by_user_id, admin_review_status, admin_remarks, reviewed_by_user_id, reviewed_at, is_immutable, is_test)
         VALUES (?, ?, ?, ?, ?, ?, 'ACKNOWLEDGED', 'Auto-generated upon collection management approval', ?, CURRENT_TIMESTAMP, 1, ?)`,
        [
          deal.id,
          deal.status,
          newDealStatus,
          newDealStatus === "FULLY_COLLECTED" ? "6. Customer Payment Collection Fully Approved & Sealed" : "5. Milestone Customer Collection Approved",
          `Customer payment collection of RM ${collectedBase.toLocaleString("en-MY", { minimumFractionDigits: 2 })} acknowledged and approved by management.`,
          approverUserId,
          approverUserId,
          isTestVal,
        ]
      );
    }

    await conn.commit();
    return { adviceCount, dealId: deal.id, skippedBeneficiaries };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Management Rejection:
 */
export async function rejectDealCollection({
  collectionId,
  approverUserId,
  approvalRemarks,
}: {
  collectionId: number;
  approverUserId: number;
  approvalRemarks: string;
}): Promise<void> {
  const [collRows] = await db().execute<any[]>(
    "SELECT * FROM deal_collections WHERE id=? LIMIT 1",
    [collectionId]
  );
  const coll = collRows[0];
  if (!coll) throw new Error("Collection record not found");

  if (coll.approval_status === "APPROVED") {
    throw new Error("Cannot reject an approved and immutable collection record.");
  }

  await db().execute(
    `UPDATE deal_collections 
     SET approval_status='REJECTED', 
         approved_by=?, 
         approved_at=CURRENT_TIMESTAMP, 
         approval_remarks=?, 
         is_immutable=1 
     WHERE id=?`,
    [approverUserId, approvalRemarks, collectionId]
  );
}

/**
 * Consolidated Payout Settlement:
 */
export async function settleConsolidatedPayout({
  beneficiaryAffiliateId,
  adviceIds,
  manualBankTxRef,
  bankName,
  bankAccountNumber,
  payoutNotes,
  disbursedByUserId,
}: {
  beneficiaryAffiliateId: number;
  adviceIds?: number[];
  manualBankTxRef: string;
  bankName?: string;
  bankAccountNumber?: string;
  payoutNotes?: string;
  disbursedByUserId: number;
}): Promise<{ batchId: number; batchCode: string; totalAmount: number; adviceCount: number }> {
  // F-01 (plan §6.3 / §7.8): insert-then-update-N pattern across payout_batches
  // and payment_advices must be atomic -- a crash between steps must not leave
  // an orphaned batch row or unpaid advices under a "settled" batch.
  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();

    let query = "SELECT id, commission_amount_myr, is_test FROM payment_advices WHERE beneficiary_affiliate_id=? AND payout_status='PENDING_DISBURSEMENT'";
    const params: any[] = [beneficiaryAffiliateId];

    if (adviceIds && adviceIds.length > 0) {
      query += ` AND id IN (${adviceIds.map(() => "?").join(",")})`;
      params.push(...adviceIds);
    }
    query += " FOR UPDATE";

    const [advices] = await conn.execute<any[]>(query, params);
    if (advices.length === 0) {
      throw new Error("No pending payment advices found to disburse for this affiliate.");
    }

    const totalAmount = advices.reduce((sum, a) => sum + Number(a.commission_amount_myr || 0), 0);
    const adviceCount = advices.length;
    const batchCode = generateBatchCode();
    const isTestVal = advices[0]?.is_test ?? 1;

    const [batchRes]: any = await conn.execute(
      `INSERT INTO payout_batches 
        (batch_code, beneficiary_affiliate_id, total_amount_myr, advice_count, manual_bank_tx_ref, bank_name, bank_account_number, payout_notes, disbursed_by, is_test)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        batchCode,
        beneficiaryAffiliateId,
        totalAmount,
        adviceCount,
        manualBankTxRef,
        bankName || null,
        bankAccountNumber || null,
        payoutNotes || null,
        disbursedByUserId,
        isTestVal,
      ]
    );
    const batchId = batchRes.insertId;

    const targetIds = advices.map((a) => a.id);
    await conn.execute(
      `UPDATE payment_advices 
       SET payout_status='PAID', 
           paid_at=CURRENT_TIMESTAMP, 
           manual_bank_tx_ref=?, 
           payout_notes=?, 
           payout_batch_id=? 
       WHERE id IN (${targetIds.map(() => "?").join(",")})`,
      [manualBankTxRef, payoutNotes || null, batchId, ...targetIds]
    );

    await conn.commit();
    return { batchId, batchCode, totalAmount, adviceCount };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
