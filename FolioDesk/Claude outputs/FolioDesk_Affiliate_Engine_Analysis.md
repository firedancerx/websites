# FolioDesk Website — Affiliate Engine & IIS→DigitalOcean Migration Analysis

Prepared as an engineering handover reference: end-to-end read of both codebases (`D:\Websites\FolioDesk\WebsiteBuild` — original IIS build, and `D:\Websites\FolioDesk\GITHubDigitalOcean\FolioDesk\WebsiteBuild` — DigitalOcean adaptation), the MySQL schema, and every API route implementing the affiliate/sales/commission workflow.

---

## 0. System shape

Next.js (App Router) monolith, MySQL 8.4, three portals:
- **Public marketing site** (`app/page.tsx`, `pricing`, `solutions`, `roles`, `demo`, `platform`)
- **Affiliate self-service portal** (`app/portal/*`) — registration, dashboard, prospect/deal tracking, profile
- **Admin console** (`app/admin/*`) — applications, approvals, deals, collections, payouts, settings

Data model (`db/mysql-schema.sql`): `users`, `affiliate_applications`, `application_status_history`, `affiliate_profile_updates`, `onboarded_customers`, `deal_pipeline`, `deal_funnel_steps`, `deal_closure_logs`, `deal_collections`, `payment_advices`, `payout_batches`, `packages`, `system_settings`, `audit_events`, `sessions`, `countries`/`states`.

---

## 1. Affiliate Application Lifecycle

**Enum** (`affiliate_applications.status`): `SUBMITTED, UNDER_REVIEW, INFORMATION_REQUIRED, CORRECTION_REQUIRED, APPROVED, REJECTED, SUSPENDED, TERMINATED, RETRACTED, RETRACTION_ACKNOWLEDGED`

| Transition | Trigger | File | Notes |
|---|---|---|---|
| — → `SUBMITTED` | Applicant registers | `app/api/register/route.ts` | Generates 9-char `affiliate_code` via `generateAffiliateCode()` (`lib/auth.ts`), uniqueness retry loop capped at 10 attempts with **no fallback on exhaustion**. Uploads ID doc + "holding ID" proof to local disk (IIS) / DO Spaces (DO, via `lib/storage.ts`). Wrapped in a DB transaction (`conn.beginTransaction/commit/rollback`) — correct pattern. Logs `application_status_history` + `audit_events` (`APPLICATION_SUBMITTED`). |
| `SUBMITTED/UNDER_REVIEW/etc` → any allowed status | Admin decision | `app/api/admin/applications/[id]/route.ts` | Single generic endpoint, `ADMIN`-only (`requireAdmin()`), status whitelisted via an `allowed` Set matching the DB enum. `APPROVED` sets `users.role='AFFILIATE'`, `users.status='ACTIVE'`. `SUSPENDED`/`TERMINATED` set `users.status='SUSPENDED'`. `decided_at` set only for `{APPROVED,REJECTED,SUSPENDED,TERMINATED,RETRACTION_ACKNOWLEDGED}`. **Not transaction-wrapped** — three sequential `db().execute()` calls. |
| `CORRECTION_REQUIRED`/`INFORMATION_REQUIRED`/`UNDER_REVIEW`/`SUBMITTED` → `SUBMITTED` | Applicant edits profile | `app/api/profile/update/route.ts` | Forces status back to `SUBMITTED`, clears `flag_id_doc_unclear`/`flag_holding_id_unaccepted`, resets `submitted_at`. Logs history only when previous status was `CORRECTION_REQUIRED`/`INFORMATION_REQUIRED`. |
| `APPROVED` + profile edit → shadow queue | Applicant edits after approval | `app/api/profile/update/route.ts` | Edits do **not** apply live; upserted into `affiliate_profile_updates` (`status='PENDING_APPROVAL'`) — a proper eKYC-style re-verification queue, good design. |
| `affiliate_profile_updates.PENDING_APPROVAL` → `APPROVED`/`REJECTED` | Admin | `app/api/admin/profile-updates/[id]/route.ts` | `APPROVE` copies fields onto `affiliate_applications` + updates `users.full_name` — two related writes, **not transaction-wrapped**. |
| any (not already RETRACTED*) → `RETRACTED` | Affiliate self-service | `app/api/profile/retract/route.ts` | Instant, no approval gate. Sets `decided_at=NOW()`. |
| `RETRACTED` → `RETRACTION_ACKNOWLEDGED` | Admin | `admin/applications/[id]/route.ts` (same generic endpoint) | Historical commissions documented as still honored in note text only — **not enforced in code**. |
| (reinstatement) → `SUBMITTED` | Logged-in user, `isReinstatement=1` flag | `app/api/register/route.ts` | Reuses existing user/application row, resets `decided_at=NULL`. This is the one admin-adjacent flow that **is** transaction-wrapped. |

**Side effects across the lifecycle**: affiliate_code generation, role escalation, file uploads (local disk in IIS build, DO Spaces in cloud build), dual audit logging (`application_status_history` + `audit_events`) — inconsistently applied (eKYC approve/reject and retract log only `audit_events`).

---

## 2. Deal / Sales Funnel Lifecycle

**Enum** (`deal_pipeline.status`): `LEAD_SUBMITTED, QUALIFIED, PROPOSAL_SENT, SUSPENDED_EFFORT, ABORTED, CONTRACT_SIGNED, INVOICED, PARTIAL_COLLECTED, FULLY_COLLECTED, UNCOLLECTIBLE`

**Creation — three inconsistent entry points:**
1. `app/api/portal/prospects/route.ts` (affiliate) — forces `LEAD_SUBMITTED`, enforces `checkProspectExclusivity()`, writes full funnel-step audit trail. **This is the reference implementation.**
2. `app/api/portal/leads/route.ts` (affiliate, simpler path) — inserts directly, **skips exclusivity check and funnel-step logging**.
3. `app/api/admin/deals/route.ts` (`action=CREATE_DEAL`, admin) — admin picks `initialStatus` freely, **also skips exclusivity check and funnel logging**.

**Exclusivity rule** (`checkProspectExclusivity()`, `lib/funnel.ts`): case-insensitive/trimmed exact match on `customer_name` across all affiliates; locked unless existing deal is `ABORTED`/`UNCOLLECTIBLE`, or `is_force_closed=0` / under active appeal. Only enforced in path #1 above.

**Step submission/review pattern:**
- Affiliate logs progress: `POST /api/portal/prospects/[id]/step` → `logFunnelStep()` (`lib/funnel.ts`). Inserts into `deal_funnel_steps`, `admin_review_status='PENDING_REVIEW'`, `is_immutable=1` set at insert (before review — semantically odd).
- Backtracking guard: hardcoded `STAGES_ORDER = [LEAD_SUBMITTED, QUALIFIED, PROPOSAL_SENT, CONTRACT_SIGNED, INVOICED, FULLY_COLLECTED]` with `getStageIndex()`; special-cases `PARTIAL_COLLECTED→4`, `SUSPENDED_EFFORT→2` via magic numbers. `ABORTED` not represented — fragile if stages are ever reordered/added.
- Admin review: `POST /api/admin/deals/[id]/step-review/route.ts` → `reviewFunnelStep()` sets `ACKNOWLEDGED`/`RETURNED_FOR_REVIEW`. **Only on `ACKNOWLEDGED` does `deal_pipeline.status` actually update** — funnel-step table and canonical deal status sync only at acknowledgement.
- Direct admin override: `admin/deals/route.ts` (`action=UPDATE_STATUS`) — free-form `targetStatus` (string equality checks, not enum-validated against the type), auto-acknowledges pending steps, inserts synthetic `ACKNOWLEDGED` step. Also handles invoice issuance (`invoice_number`, `invoiced_at`, `invoice_target` PROSPECT/AFFILIATE).

**Force-closure / appeal sub-workflow** (`app/api/admin/deals/[id]/closure/route.ts` + `lib/funnel.ts`):
- `forceCloseDeal()` — `is_force_closed=1`, `status='ABORTED'`, logs `deal_closure_logs(action_type='FORCED_CLOSURE')`.
- `submitDealAppeal()` (`app/api/portal/prospects/[id]/appeal/route.ts`, affiliate) — sets `appeal_status='APPEAL_SUBMITTED'`. **Does not check `is_force_closed` before allowing an appeal.**
- `adjudicateDealAppeal()` — approve: `appeal_status='APPEAL_APPROVED'`, `is_force_closed=0`, **hardcodes `status='PROPOSAL_SENT'`** regardless of the deal's actual pre-closure stage — **correctness bug**: a deal force-closed at `CONTRACT_SIGNED` gets silently demoted to `PROPOSAL_SENT` on a successful appeal. Also increments `extension_days_granted`.
- `extendDealDirectly()` — admin can grant extension days without an appeal at all ("Direct Extension"), clears `is_force_closed`.
- `calculateClosureDeadline()` computes `created_at + closurePeriodDays + extensionDays`, but no reviewed code path automatically force-closes an overdue deal — appears to be a manual-only admin action, or the deadline is UI-decorative unless a cron exists outside the reviewed files.

---

## 3. Collections → Commission → Payout Pipeline

**`submitDealCollection()`** (`lib/funnel.ts`, via `app/api/admin/deals/[id]/collect/route.ts`, admin-only):
- Requires deal to already have `invoice_number`.
- Rejects if `deal.status` is `FULLY_COLLECTED`, or (dead code) `CLIENT_ONBOARDED`/`CLOSED_WON` — **neither string exists in the actual enum**, leftover from a prior schema version, functionally inert beyond the real `FULLY_COLLECTED` check.
- Rejects if sum of already-**approved** collections ≥ `contract_value_myr`.
- Inserts `deal_collections` (`approval_status='PENDING_APPROVAL'`, `is_immutable=0`), **locking** `locked_direct_rate_pct`/`locked_upline_l1_rate_pct`/`locked_upline_l2_rate_pct` from `getCommissionSettings()` (`lib/settings.ts`, `system_settings` table, defaults 10% / 3% / 1.5%) — snapshot-at-submission mechanism, correctly designed.

**`approveDealCollection()`** (via `app/api/admin/collections/[id]/approve/route.ts`):
- Guards against double-approval (throws if already `APPROVED`).
- Sets `approval_status='APPROVED'`, `is_immutable=1`.
- Walks upline via `findUplineChain()` — hardcoded max 2 levels (direct → `upline_affiliate_code` chain); deeper chains simply aren't paid, by design.
- Inserts one `payment_advices` row per existing beneficiary at the **locked** rate × `collected_amount_myr`, `payout_status='PENDING_DISBURSEMENT'`, `is_immutable=1`.
- Recomputes total approved collections → `deal_pipeline.status` becomes `FULLY_COLLECTED` (if `is_final_collection` or total ≥ contract value) or `PARTIAL_COLLECTED`.
- Auto-syncs an `onboarded_customers` row (dedup by affiliate+email/name), auto-acknowledges pending funnel steps, inserts a synthetic step.
- **Critical finding**: this function performs up to 6+ sequential writes across 5 tables (`deal_collections`, `payment_advices` ×≤3, `deal_pipeline`, `onboarded_customers`, `deal_funnel_steps`) with **no transaction wrapper**. A mid-function failure leaves partially-created commission records with no rollback path.

**`rejectDealCollection()`** — sets `approval_status='REJECTED'`, `is_immutable=1` (rejected records also become immutable, presumably for audit trail integrity). Guards against rejecting an already-approved record.

**Payout batching** — `settleConsolidatedPayout()` (via `app/api/admin/payouts/batch/route.ts`):
- Pulls all `PENDING_DISBURSEMENT` advices for a beneficiary (optionally filtered to specific `adviceIds`), sums `commission_amount_myr`, creates one `payout_batches` row (`batch_code = DISB-<year>-<hex>`), then bulk-updates matched advices to `PAID`, stamping `payout_batch_id`/`manual_bank_tx_ref`/`paid_at`.
- **Also not transaction-wrapped** — insert-then-update-N pattern; a crash between steps leaves an orphaned batch row or unpaid advices under a "settled" batch.

**Single-advice payout** — `app/api/admin/payouts/[id]/route.ts` lets an admin mark one advice `PAID`/`CANCELLED` directly, **bypassing the batch mechanism entirely**, with **no guard against re-flipping an already-`PAID`/`CANCELLED` row** — unlike the collection functions' explicit immutability checks.

**Money math**: `commission_amount_myr = collected_amount_myr × (locked_rate / 100)` computed in JS floats, no decimal library. Acceptable at current volume; worth revisiting if transaction volume or precision requirements grow.

---

## 4. Cross-Cutting Mechanisms

- **`is_test` flag**: present on nearly every business table. Pattern `isTestVal = isTest !== undefined ? isTest : 1` appears repeatedly — omitting the flag defaults new records to **test** (safe default), but propagation is inconsistent: `portal/leads/route.ts` never sets it explicitly (relies on DB column default) while `portal/prospects/route.ts` does pass it through — a latent source of test-data/live-data classification drift.
- **`app/api/admin/toggle-test-mode/route.ts`** — generic entity toggler (`entityType`: `affiliate|deal|collection|payment_advice`) mapped to a hardcoded table-name lookup, then `UPDATE ${tableName} SET is_test=? WHERE id=?` — string-interpolated table name, currently safe only because the entity-type enum is checked before lookup; flag as a pattern risk if the whitelist is ever extended carelessly.
- **Separate "admin data mode" toggle** (`TEST|ACTUAL|ALL`) — `lib/settings.ts` (`getAdminDataMode`/`updateAdminDataMode`), stored in **both** `system_settings` and mirrored into an `admin_data_mode` cookie — two sources of truth for one setting, can drift.
- **Auth/session** (`lib/auth.ts`): PBKDF2 (210,000 rounds, SHA-512, 32-byte key), per-user random salt, stored `pbkdf2$rounds$salt$hash`. Sessions: random 32-byte token, only SHA-256 hash stored in `sessions.token_hash`, 7-day expiry, `fd_session` httpOnly cookie (`sameSite:"lax"`). Roles: `APPLICANT`/`AFFILIATE`/`ADMIN`, gated by a simple `requireAdmin()` boolean check — no granular permissions. **No CSRF protection** on any state-changing POST endpoint beyond `sameSite:lax`. Password change doesn't revoke other active sessions.
- **Audit pattern**: two parallel logs — `application_status_history` (application-specific) and generic `audit_events` (`actor_user_id, action, entity_type, entity_id, event_data` JSON). Coverage inconsistent across endpoints; payout single-advice route and step-review write neither.

---

## 5. IIS → DigitalOcean Migration — What Changed

### Environment & config
- IIS `.env.example`: 6 vars — plain `DATABASE_URL` (root user), `SESSION_SECRET`, `ADMIN_EMAIL/PASSWORD/NAME`, `NEXT_PUBLIC_SITE_URL`.
- DO `.env.example` adds: `DATABASE_SSL_MODE`, `DATABASE_CA_CERT`, `DATABASE_POOL_SIZE`, and a full Spaces block (`FILE_STORAGE_PROVIDER`, `SPACES_ENDPOINT` = `https://sgp1.digitaloceanspaces.com`, `SPACES_REGION`, `SPACES_BUCKET`, `SPACES_ACCESS_KEY`, `SPACES_SECRET_KEY`). `DATABASE_URL` uses a dedicated `foliodesk_app` DB user, not root.

### Dependencies
- DO adds `@aws-sdk/client-s3@3.1131.0` and pins `packageManager: pnpm@11.19.0`.
- MySQL driver unchanged (`mysql2@3.14.5`) both sides.
- DO adds `db:verify`, `db:reconcile`, `db:test-migration` scripts; drops the `--env-file=.env.local` flag on `db:migrate` (platform injects env vars directly).

### Infrastructure / deployment
- DO adds `.do/app-production.yaml` and `.do/app-staging.yaml` (App Platform specs). No Dockerfile/Procfile — native `node-js` buildpack.
- Key production spec fields:
  - `build_command: corepack enable && pnpm install --frozen-lockfile && pnpm run build`
  - `run_command: pnpm run start`, `http_port: 8080`, `instance_count: 2`, `instance_size_slug: apps-s-1vcpu-1gb`
  - `health_check.http_path: /foliodesk/api/health` (new `app/api/health` route, DO-only)
  - `PRE_DEPLOY` job `schema-migrate` runs `pnpm run db:migrate && pnpm run db:verify` before the web service deploys
  - Attached managed DB: `engine: MYSQL, version: "8.4"` via `${db.DATABASE_PRIVATE_URL}` / `${db.CA_CERT}`
  - `DATABASE_SSL_MODE: verify-ca` in both staging/prod
  - Staging vs. production: `instance_count 1` vs `2`, `DATABASE_POOL_SIZE "10"` vs `"20"`, staging auto-deploys on push, production requires manual deploy from `main`
- **Cruft**: `web.config` and `setup-iis.ps1` remain, byte-identical, in the DO repo — dead files, harmless, should be pruned.

### Database
- Both sides still MySQL (no Postgres migration). Schema is functionally identical between copies (minor column reordering only).
- `lib/db.ts` is the real adaptation point: DO version adds `sslConfig()` (reads `DATABASE_SSL_MODE`/`DATABASE_CA_CERT`, defaults `verify-ca` in production, throws if `DATABASE_CA_CERT` missing under `verify-ca`), connection pooling via `DATABASE_POOL_SIZE` (default 10), `waitForConnections`, `enableKeepAlive`. IIS version is a bare `mysql.createPool(process.env.DATABASE_URL)` — appropriate for each hosting model.
- New `types/database.d.ts` (DO-only) — `DatabaseRow`/`DatabaseResult`/`DatabaseResultRow<T>` type aliases wrapping `mysql2/promise` types, likely added to satisfy stricter TS checking once the AWS SDK types entered the project.

### File storage / uploads — correctly migrated
- IIS: `app/api/register/route.ts` imports `writeFile`/`mkdir` from `node:fs/promises`, writes ID-verification uploads to local disk.
- DO: same route imports `saveUpload`/`validateUpload` from new `lib/storage.ts`, which provider-switches: `FILE_STORAGE_PROVIDER=spaces` → `@aws-sdk/client-s3` against DO Spaces with path-traversal-guarded object keys; `FILE_STORAGE_PROVIDER=local` → falls back to `public/uploads` with the same guard.
- Both app-spec files correctly set `FILE_STORAGE_PROVIDER=spaces` for real deployments.
- **Operational risk to flag**: DO App Platform instance disks are ephemeral. If this env var is ever omitted or misconfigured back to `local` in a live deployment, uploaded ID documents will silently write to ephemeral storage and vanish on the next redeploy/restart. Treat as a non-negotiable env var in any future config change.

### Other migrated items
- New `lib/errors.ts` (DO-only) — small AWS-SDK-error-shape normalization helpers.
- New `app/api/health` route (DO-only), required by App Platform health checks.
- `README.md`: DO version removes the IIS version's documented hardcoded default admin password — a real security-hygiene improvement.
- `tsconfig.tsbuildinfo` present as a committed build artifact in the DO working tree — should be gitignored if not already.

---

## 6a. UI State-Machine Consistency Audit (button enablement vs backend status)

Follow-up pass reading every admin/portal React component that triggers a state transition, checking whether each control's enabled/disabled/visible condition actually matches the record's current status.

### Control-by-control findings

| File | Control | Transition | Enablement condition | Problem |
|---|---|---|---|---|
| `admin/payouts/PayoutsView.tsx` | "Disburse Payment" | `PENDING_DISBURSEMENT → PAID` | `{!isPaid && <button>}` where `isPaid = payout_status === "PAID"` | **Only excludes PAID, never CANCELLED.** A CANCELLED advice still shows the Disburse button — combined with the backend's missing re-flip guard (§3), this actively invites re-disbursing a cancelled advice. |
| `admin/payouts/PayoutsView.tsx` | "Confirm Individual Disbursement" | same | Plain `<button type="submit">`, no disabled/loading state | **Double-submit risk** on the single highest-risk, irreversible action in the system (bank disbursement), with no server-side idempotency guard to catch the duplicate either. |
| `admin/collections/CollectionsApprovalView.tsx` | Approve/Reject | `PENDING_APPROVAL → APPROVED/REJECTED` | `isPending ? <buttons> : <span>Closed</span>` | Correctly gated — good reference example. |
| `admin/collections/CollectionsApprovalView.tsx` | Approve/Reject modal submit | same | No disabled-while-submitting state | Double-submit risk. |
| `admin/approvals/ApprovalsView.tsx` | Approve/Reject (all 3 categories: applications, profile updates, collections) | various | Rendered unconditionally for every row passed in; no client-side status re-check, no disabled-while-submitting | Relies entirely on the parent query pre-filtering to pending rows; a stale cache or race would still render live submit buttons. Double-submit risk on all three forms. |
| `admin/AdminNetworkView.tsx` | Approve/Reactivate, Suspend, Terminate, Reject, Acknowledge (retraction) | application status transitions | Explicit per-status allow-lists, e.g. Suspend: `status === "APPROVED"`; Terminate: `status === "APPROVED" \|\| "SUSPENDED"`; Reject: `["SUBMITTED","UNDER_REVIEW","INFORMATION_REQUIRED","CORRECTION_REQUIRED"].includes(status)` | Mostly correct and the best-gated file in the codebase. One open question: REJECTED is not excluded from re-Approval — may be an intentional reversal path, should be confirmed as designed rather than accidental. |
| `admin/deals/DealsView.tsx` / `[id]/DealDetailView.tsx` | Suspend, Abort, Issue Invoice, Record Collection | deal_pipeline transitions | Explicit status-list conditions (e.g. Invoice: `status==="CONTRACT_SIGNED" && !invoice_number`) | Correctly gated. |
| `admin/deals/[id]/DealDetailView.tsx` | "Re-issue/Replace Invoice" | re-issue on an already-invoiced deal | Shown whenever invoiced and not fully finalized, **including after PARTIAL_COLLECTED** | Allows changing the invoice number on a deal that already has approved, **immutable** collection records referencing the old invoice number — no warning that this desyncs from locked historical records. |
| `admin/deals/[id]/DealDetailView.tsx` | Invoice-target toggle (PROSPECT/AFFILIATE billing) | — | `disabled={invoiceTarget === currentValue}` only — **no deal-status check at all** | Sits outside the "fully finalized" conditional block, so the billing target can be flipped even on a FULLY_COLLECTED/closed deal after money has already moved. |
| `admin/deals/[id]/DealDetailView.tsx` | "Adjudicate Appeal" | appeal decision | Dropdown defaults to Approve; submits to a handler that (per the backend bug already logged) hardcodes the resulting stage to `PROPOSAL_SENT` | **UI compounds the known backend bug** — nothing tells the admin the deal will be reset to PROPOSAL_SENT regardless of its actual prior stage; an admin approving an appeal on a CONTRACT_SIGNED deal gets a silent regression with no warning. |
| `admin/ToggleTestModeButton.tsx` | Toggle `is_test` on affiliate/deal/collection/advice | — | **No status check whatsoever** — wired into rows in `CollectionsApprovalView` and `PayoutsView` regardless of `is_immutable`/`approval_status`/`payout_status` | Highest-severity UI finding: an admin can flip a **locked, approved, immutable collection** or a **PAID payment advice** between test/production classification after the fact, silently corrupting real-vs-test reporting on money that has already moved. Only guard is a client `confirm()` dialog. |
| `portal/RetractButton.tsx` | "Confirm Retraction" | → RETRACTED | No status check in the component itself (relies on caller) | Correctly has a `disabled={submitting}` guard — the **only** transition control in the codebase with proper double-submit protection. |
| `portal/ProfileEditForm.tsx` | Field-level edit enablement | — | `canEditUpline`/`canEditUploads` = `CORRECTION_REQUIRED \|\| INFORMATION_REQUIRED` (+ uploads also allow APPROVED) | Correct, granular gating — good reference example. |
| `portal/ProfileEditForm.tsx` | Submit button | — | Only password-validation errors disable it — **never gated on affiliate status** | A RETRACTED or SUSPENDED affiliate can still submit this form client-side (see §6b Finding 3 for the matching server-side gap). |
| `admin/applications/[id]/correction/page.tsx` | Prospects pipeline status badges | display only | Hardcodes labels for `NEGOTIATION`, `CLOSURE_PENDING`, `PARTIALLY_COLLECTED` | **None of these three strings exist in the real `deal_pipeline.status` enum** (correct spelling is `PARTIAL_COLLECTED`) — dead code, evidence the UI was written against an earlier/hypothetical richer status set than the backend implements. |

### Maker-checker / role-handoff findings — the biggest structural gap

**There is no distinct "management" tier anywhere in the code.** Every approval action — affiliate application decisions, profile-update approval, collection approval (which locks commission rates and generates payment advices), payout disbursement, and appeal adjudication — is gated purely by a single flat `requireAdmin()` check. Yet the UI copy repeatedly implies a second-level control that doesn't exist:

- `DealsView.tsx`: *"Submit for Management Approval," "Payment Advices will be generated immediately once approved by Management"*
- `CollectionsApprovalView.tsx`: *"Awaiting Mgt Approval," "Management Approval & Acknowledgement"*
- `ApprovalsView.tsx`: *"awaiting Superadmin review"*
- `correction/page.tsx`: *"As superadmin, you may acknowledge this retraction"*

None of this reflects real separation of duties. The same admin account can: submit a collection record, approve it (locking rates and generating commission advices), and then disburse the resulting payout — start to finish, alone, with no second sign-off, no "requested by ≠ approver" check, and no 4-eyes control anywhere. This is precisely the kind of control gap that matters most on the highest-risk, irreversible action in the system (bank disbursement) — worth treating as a design decision to make explicitly (build real maker-checker) rather than leaving the UI copy promising a control that isn't there.

### Double-submit / race-condition risk — systemic, not isolated

Every transition-triggering form in the codebase except `RetractButton.tsx` and `ToggleTestModeButton.tsx` submits via a plain `<button type="submit">` with no `disabled`/loading state during the request. Affected: all of `ApprovalsView.tsx`, `CollectionsApprovalView.tsx`, `PayoutsView.tsx` (most consequential — payouts), `DealsView.tsx`/`DealDetailView.tsx` (all transition forms), `AdminNetworkView.tsx`, `InvoicesView.tsx`, and the affiliate-side `ProspectJourneyView.tsx`/`ProspectsListView.tsx`. This is a systemic UI pattern gap, not a one-off bug — worth fixing once, centrally (a shared submit-button/hook), rather than file by file.

---

## 6b. Affiliate-Status vs Commission-Earning-Rights Audit

This is the specific question raised: does the system correctly let an affiliate keep earning/receiving commissions on deals already in motion when their affiliate status later changes (SUSPENDED/TERMINATED/RETRACTED), while correctly blocking them from taking *new* affiliate actions? Short answer: **the "keep paying old commissions" half works, but only because nothing checks status at payout time at all — and the "block new actions" half is inconsistently implemented, with real gaps.**

### Finding 1 — Upline commission chain is completely status-blind

`findUplineChain()` (`lib/funnel.ts`) fetches `status` on the direct affiliate, upline L1, and upline L2 rows — but never reads or filters on it. It walks `upline_affiliate_code` purely as a string join:

```ts
const [directRows] = await db().execute<any[]>(
  "SELECT id, user_id, legal_name, affiliate_code, upline_affiliate_code, status FROM affiliate_applications WHERE id=? LIMIT 1", [directAffiliateId]);
...
const [l1Rows] = await db().execute<any[]>(
  "SELECT id, user_id, legal_name, affiliate_code, upline_affiliate_code, status FROM affiliate_applications WHERE affiliate_code=? LIMIT 1",
  [directAffiliate.upline_affiliate_code.trim().toUpperCase()]);
```

`approveDealCollection()` then unconditionally creates a `payment_advices` row for direct/L1/L2 if present — no status gate anywhere in the chain. A SUSPENDED, TERMINATED, or RETRACTED affiliate **at any level of the upline** still receives payment advices on every approval, indefinitely, with no code distinguishing "this person left the program" from "this person is active."

### Finding 2 — `users.status` and `affiliate_applications.status` silently desync

`app/api/admin/applications/[id]/route.ts` (lines 68–75):

```ts
const userStatus = (decision === "SUSPENDED" || decision === "TERMINATED") ? "SUSPENDED" : "ACTIVE";
```

| Admin decision | `affiliate_applications.status` | `users.status` set to |
|---|---|---|
| APPROVED | APPROVED | ACTIVE (correct) |
| SUSPENDED | SUSPENDED | SUSPENDED (correct) |
| TERMINATED | TERMINATED | SUSPENDED (correct) |
| **RETRACTED** | RETRACTED | **ACTIVE** ← wrong |
| **RETRACTION_ACKNOWLEDGED** | RETRACTION_ACKNOWLEDGED | **ACTIVE** ← wrong |

Every status string other than the literal `SUSPENDED`/`TERMINATED` falls through to `"ACTIVE"` — including RETRACTED and RETRACTION_ACKNOWLEDGED, which the code's own decision-note text describes as "read-only mode." Anything downstream that trusts `users.status` as a proxy for "is this affiliate currently allowed to act" will incorrectly treat a retracted affiliate as active.

### Finding 3 — Portal routes: inconsistent status gating, one real gap

| Route | Status check | Gap |
|---|---|---|
| `app/api/portal/leads/route.ts` | Explicit blocklist: `RETRACTED, RETRACTION_ACKNOWLEDGED, SUSPENDED, TERMINATED` | Present but implicit/negative rather than `=== 'APPROVED'` — SUBMITTED/UNDER_REVIEW would also incorrectly pass. |
| `app/api/portal/prospects/route.ts` | Same blocklist | Same minor gap. |
| `app/api/portal/prospects/[id]/step/route.ts` (funnel-step submission) | **None** — only checks login + deal ownership | **Real gap**: a SUSPENDED/TERMINATED/RETRACTED affiliate can still log new funnel steps on their existing deals — this is a genuine "new affiliate action" that should be blocked and isn't. |
| `app/api/portal/prospects/[id]/appeal/route.ts` | **None** — same pattern | **Real gap**: a non-active affiliate can still submit force-closure appeals. |

### Finding 4 — No status check anywhere at payout time

Neither `settleConsolidatedPayout()` (batch payouts) nor `app/api/admin/payouts/[id]/route.ts` (single-advice payout, which bypasses the lib function entirely with a raw `UPDATE`) perform any check of the beneficiary's current affiliate status. Payouts always proceed on any `PENDING_DISBURSEMENT` advice regardless of the affiliate's status today — which happens to match the desired "always honor already-earned commissions" behavior, but only because the code never checks, not because it was deliberately designed that way.

### Finding 5 — No vesting model exists; everything is a point-in-time check

There is no `vested_at` field, no snapshot of "affiliate was APPROVED when this deal was opened," and no lifecycle distinction anywhere between:
- **(a)** commission already vested on an approved collection — should always pay regardless of a later status change, and
- **(b)** commission that would be created by a *future* collection on a deal that's still open when the affiliate's status changes — arguably should require the affiliate to still be in good standing.

The only lifecycle-aware mechanism in the whole system is the commission-*rate* lock on `deal_collections` (`locked_direct_rate_pct` etc., captured at submission time) — but that locks the rate, not eligibility. Practically: case (a) is accidentally satisfied (nothing blocks it), and case (b) is **not implemented** — a terminated affiliate's still-open deal can keep progressing (funnel steps unguarded, collection approval unguarded, payout unguarded) all the way to a paid commission, with no code path anywhere stopping it. If the intended business rule is "stop new earning, keep old earning," this needs an explicit status-snapshot-at-deal-creation or a "still in good standing" check inserted at collection-approval time — it does not exist today.

---

## 6c. Consolidated Fix List — All Three Passes

| # | Area | Finding | File(s) | Severity |
|---|---|---|---|---|
| 1 | Money integrity | No transaction wrapping on `approveDealCollection()` / `settleConsolidatedPayout()` | `lib/funnel.ts` | High |
| 2 | Money integrity | Single-advice payout route has no re-flip guard (PAID/CANCELLED can be toggled repeatedly) | `app/api/admin/payouts/[id]/route.ts` | High |
| 3 | UI/backend mismatch | Disburse button only excludes PAID, not CANCELLED — UI actively invites re-disbursing a cancelled advice | `admin/payouts/PayoutsView.tsx` | High |
| 4 | Vesting/eligibility | No status check anywhere in `findUplineChain()` / `approveDealCollection()` / payout routes — no distinction between vested and future commission | `lib/funnel.ts`, both payout routes | High — needs an explicit business decision, then implementation |
| 5 | Status sync | `RETRACTED`/`RETRACTION_ACKNOWLEDGED` incorrectly leave `users.status='ACTIVE'` | `app/api/admin/applications/[id]/route.ts` | High |
| 6 | New-action gating | Funnel-step submission and appeal submission have zero affiliate-status check — a suspended/terminated/retracted affiliate can still act on existing deals | `app/api/portal/prospects/[id]/step/route.ts`, `.../appeal/route.ts` | High |
| 7 | Data integrity | `ToggleTestModeButton` allows flipping `is_test` on immutable/approved/paid financial records with no status guard | `admin/ToggleTestModeButton.tsx` | High |
| 8 | Correctness bug | Appeal approval hardcodes deal status to `PROPOSAL_SENT` regardless of actual prior stage — UI gives no warning this will happen | `lib/funnel.ts` (`adjudicateDealAppeal`), `admin/deals/[id]/DealDetailView.tsx` | High |
| 9 | Process integrity | Three different deal-creation entry points with three different validation rule sets (exclusivity + audit logging present in only one) | `portal/prospects/route.ts`, `portal/leads/route.ts`, `admin/deals/route.ts` | Medium-High |
| 10 | Governance | "Management Approval"/"Superadmin" UI copy implies a second-level control that doesn't exist anywhere in code — flat single-admin approval on every financial action including payout disbursement | `admin/deals/DealsView.tsx`, `admin/collections/CollectionsApprovalView.tsx`, `admin/approvals/ApprovalsView.tsx`, `admin/applications/[id]/correction/page.tsx` | Medium-High — design decision needed |
| 11 | UI robustness | No disabled/loading state on nearly every transition-triggering submit button — systemic double-submit risk, worst on payout disbursement | Nearly every admin/portal transition form except `RetractButton.tsx`, `ToggleTestModeButton.tsx` | Medium |
| 12 | Data integrity | Invoice re-issue and invoice-target toggle both allowed on deals with already-approved, immutable collections — can desync billing records from locked history | `admin/deals/[id]/DealDetailView.tsx` | Medium |
| 13 | Code hygiene | Dead status branches referencing a non-existent enum (`NEGOTIATION`, `CLOSURE_PENDING`, `PARTIALLY_COLLECTED`, `CLIENT_ONBOARDED`, `CLOSED_WON`) — evidence of drift from an earlier schema | `admin/applications/[id]/correction/page.tsx`, `lib/funnel.ts` | Low-Medium |
| 14 | Test/prod hygiene | `is_test` propagation inconsistent across insert paths; separate `admin_data_mode` cookie/setting can drift from the `is_test` column mechanism | `app/api/portal/leads/route.ts`, `lib/settings.ts` | Low-Medium |
| 15 | Security | No CSRF protection, no rate limiting on login/register, no session revocation on password change | `lib/auth.ts` and all state-changing POST routes | Medium (longer-term) |

---

## 7. Maker-Checker Implementation Plan (Admin vs Management)

Decisions locked in before this design (per stakeholder sign-off):
- **MANAGEMENT is a new, distinct role** in the `users.role` enum — not a flag on ADMIN.
- **In scope for mandatory second sign-off**: (1) collection approval, (2) payout disbursement, (3) affiliate application approval, (4) force-closure & appeal adjudication.
- **Strict separation of duties**: a Management-role user can never also hold Admin rights. The two pools are disjoint, org-wide — not just "not on the same transaction."
- **Hard cutover**: no feature flag. Ships as mandatory in the next release; Management accounts must be provisioned *before* that release goes live, or Admins will be unable to complete any in-scope action.

### 7.1 Role model changes

**Schema** (`db/mysql-schema.sql`):

```sql
ALTER TABLE users
  MODIFY COLUMN role ENUM('APPLICANT','AFFILIATE','ADMIN','MANAGEMENT') NOT NULL DEFAULT 'APPLICANT';
```

**Enforcement of strict separation** — add a DB-level guard, not just an application check, since this is a control that must hold even if application code has a bug:

```sql
-- Trigger: reject any attempt to set role='MANAGEMENT' on a user who has ever held ADMIN,
-- and vice versa. Simplest robust approach: track role history, block on prior-role check.
```

In practice, implement this as an application-layer check backed by a new `role_history` audit column (or reuse `audit_events` — every `role` UPDATE on `users` is already loggable there) rather than a DB trigger, since MySQL triggers can't easily express "never in the past." The authoritative rule lives in the admin user-management endpoint (new: `app/api/admin/users/route.ts`, doesn't exist yet — see 7.6) which must reject promoting an ex-ADMIN to MANAGEMENT or an ex-MANAGEMENT to ADMIN, checked against `audit_events` history for that `user_id`.

**`requireManagement()`** — new auth helper in `lib/auth.ts`, parallel to the existing `requireAdmin()`:

```ts
export async function requireManagement(): Promise<AuthUser> {
  const user = await currentUser();
  if (!user || user.role !== "MANAGEMENT") throw new UnauthorizedError();
  return user;
}
```

### 7.2 Data model: a single generic approval-queue table (not four bespoke ones)

Rather than bolting a `PENDING_MGT_APPROVAL` sub-status onto four different tables (which is how the existing `affiliate_profile_updates` shadow-queue pattern already works, inconsistently, in one place), introduce one shared table that all four in-scope actions route through. This keeps the maker-checker logic, UI, and audit trail centralized and consistent — the exact opposite of the fragmentation problem this whole review is about.

```sql
CREATE TABLE IF NOT EXISTS maker_checker_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_type ENUM(
    'COLLECTION_APPROVAL',
    'PAYOUT_DISBURSEMENT',
    'APPLICATION_APPROVAL',
    'CLOSURE_APPEAL_ADJUDICATION'
  ) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,        -- 'deal_collections' | 'payment_advices' | 'payout_batches' | 'affiliate_applications' | 'deal_pipeline'
  entity_id BIGINT UNSIGNED NOT NULL,
  action_payload JSON NOT NULL,            -- the exact decision the maker proposed (e.g. {"decision":"APPROVED"} or {"decision":"REJECTED","adviceIds":[...]})
  status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  submitted_by BIGINT UNSIGNED NOT NULL,   -- the Admin (maker)
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_by BIGINT UNSIGNED NULL,         -- the Management user (checker)
  decided_at TIMESTAMP NULL,
  decision_notes TEXT NULL,
  is_immutable TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_mc_submitter FOREIGN KEY (submitted_by) REFERENCES users(id),
  CONSTRAINT fk_mc_decider FOREIGN KEY (decided_by) REFERENCES users(id),
  CONSTRAINT chk_mc_separation CHECK (decided_by IS NULL OR decided_by <> submitted_by),
  INDEX idx_mc_status (status),
  INDEX idx_mc_type (request_type),
  INDEX idx_mc_entity (entity_type, entity_id)
);
```

The `chk_mc_separation` CHECK constraint is a real, DB-enforced backstop (MySQL 8.0.16+ supports CHECK constraints) against the same person submitting and approving a given request — belt-and-braces alongside the application-layer role check, since role alone doesn't prevent a compromised session or a bug from approving one's own request if roles were ever misconfigured.

### 7.3 Per-action flow changes

**(1) Collection approval** — currently: `app/api/admin/collections/[id]/approve/route.ts` calls `approveDealCollection()` directly, ADMIN-only, does the approval AND generates payment advices in one step.

New flow:
- Admin action on a `PENDING_APPROVAL` collection no longer calls `approveDealCollection()`. It instead inserts a `maker_checker_requests` row (`request_type='COLLECTION_APPROVAL'`, `entity_type='deal_collections'`) and leaves `deal_collections.approval_status` unchanged (still `PENDING_APPROVAL`) — the collection record itself doesn't move until Management decides.
- New Management-only endpoint `app/api/management/collections/[id]/decide/route.ts` — `requireManagement()`, loads the pending request, rejects if `decided_by` would equal `submitted_by` (defense in depth beyond the DB constraint), and only on approval actually calls `approveDealCollection()` (unchanged internals, still needs the transaction-wrapping fix from §6c #2).
- On rejection, `deal_collections.approval_status` → `REJECTED` as today, but the `maker_checker_requests` row records who rejected it and why.

**(2) Payout disbursement** — currently: `app/api/admin/payouts/[id]/route.ts` (single) and `app/api/admin/payouts/batch/route.ts` (batch), both ADMIN-only, both write `PAID` directly.

New flow:
- Admin "Disburse" action creates a `maker_checker_requests` row (`request_type='PAYOUT_DISBURSEMENT'`) capturing the exact payload — which `adviceIds` (single or batch), the `manual_bank_tx_ref`, bank details. **Nothing changes on `payment_advices`/`payout_batches` yet** — `payout_status` stays `PENDING_DISBURSEMENT`.
- New Management-only endpoint `app/api/management/payouts/decide/route.ts` — on approval, executes the actual `settleConsolidatedPayout()` / single-advice update with the maker's original payload (Management cannot alter amounts or bank refs — only approve-as-submitted or reject-with-reason, which is the correct control: a checker validates, doesn't re-author). Also closes the §6c #6 gap (single-advice route immutability) as part of this rebuild, since the route is being rewritten anyway.

**(3) Affiliate application approval** — currently: `app/api/admin/applications/[id]/route.ts`, one generic ADMIN-only endpoint handling all nine outbound transitions.

New flow — **only the `APPROVED` transition** requires Management sign-off (the others — UNDER_REVIEW, INFORMATION_REQUIRED, CORRECTION_REQUIRED, REJECTED, SUSPENDED, TERMINATED, RETRACTION_ACKNOWLEDGED — are either reversible, non-financial, or restrictive/protective actions where requiring a second sign-off just slows down legitimate risk management without a matching control benefit):
- Admin action for decision=`APPROVED` creates a `maker_checker_requests` row (`request_type='APPLICATION_APPROVAL'`) instead of calling the status-update SQL. Application status moves to a **new intermediate status** — see 7.4 below, this requires one schema addition.
- Management approves → the existing APPROVED-transition logic runs (affiliate_code confirmation, `users.role='AFFILIATE'`, `users.status='ACTIVE'`).
- Management rejects → application reverts to `UNDER_REVIEW` with the rejection reason logged, so the Admin can re-submit or take a different path.

**(4) Force-closure & appeal adjudication** — currently: `app/api/admin/deals/[id]/closure/route.ts`, ADMIN-only, covers `forceCloseDeal()`, `adjudicateDealAppeal()`, `extendDealDirectly()`.

New flow — maker-checker applies to **adjudication of an appeal** specifically (the decision that reopens/restages a deal and, per §6b, has direct commission-eligibility consequences), not to the initial force-close action itself (force-closing is the protective action that triggers the appeal right in the first place — gating it would let a bad-faith admin sit on force-closures pending a checker instead of applying them promptly):
- Admin reviewing an `APPEAL_SUBMITTED` deal creates a `maker_checker_requests` row (`request_type='CLOSURE_APPEAL_ADJUDICATION'`) with their proposed decision (approve/reject) instead of calling `adjudicateDealAppeal()` directly.
- Management approves → `adjudicateDealAppeal()` executes (this is also where the §6c #8 hardcoded-`PROPOSAL_SENT` bug must be fixed as part of the same change — Management needs to see and confirm the *actual* target stage, not a hardcoded one, so fixing the bug is a hard prerequisite for this flow to be meaningful).

### 7.4 Schema addition needed for application approval gating

`affiliate_applications.status` needs one new value to represent "Admin has recommended approval, awaiting Management sign-off" — distinct from `UNDER_REVIEW` (still being actively reviewed) so the two queues (Admin's review queue vs Management's approval queue) don't collide:

```sql
ALTER TABLE affiliate_applications
  MODIFY COLUMN status ENUM(
    'SUBMITTED','UNDER_REVIEW','INFORMATION_REQUIRED','CORRECTION_REQUIRED',
    'PENDING_MANAGEMENT_APPROVAL',
    'APPROVED','REJECTED','SUSPENDED','TERMINATED','RETRACTED','RETRACTION_ACKNOWLEDGED'
  ) NOT NULL DEFAULT 'SUBMITTED';
```

This is the one place a bespoke status is warranted rather than routing purely through `maker_checker_requests.status`, because the affiliate-facing portal already displays `affiliate_applications.status` directly to the applicant (§1) — they need a visible, correctly-labeled state ("Recommended for approval, pending final sign-off") rather than silently sitting in `UNDER_REVIEW` while a shadow table changes underneath them.

### 7.5 UI changes

- **New `/management` route tree**, structurally mirroring `/admin` but scoped to `requireManagement()`: `app/management/queue/page.tsx` (a single unified inbox across all four request types, each row showing request type, maker, submitted date, entity summary, and Approve/Reject actions), plus type-specific detail views reusing the existing Admin detail components in read-only/decision mode (e.g. `DealDetailView.tsx` gets a `mode="management-review"` prop rather than a parallel component).
- **Admin-side changes**: every affected Admin screen (`CollectionsApprovalView.tsx`, `PayoutsView.tsx`, `admin/applications/[id]/...`, `DealDetailView.tsx`'s appeal adjudication) changes its submit action from "commit the transition" to "submit for Management approval," with the button relabeled accordingly and a visible "Pending Management Review" status badge shown once submitted — replacing the current cosmetic-only "Awaiting Mgt Approval" copy identified in §6a with an actually-true state.
- **Both Admin and Management screens get the disabled/loading submit-button fix from §6c #11** as part of this work, since every one of these forms is being touched anyway.
- **New nav entry**: `AdminNav.tsx` needs a parallel `ManagementNav.tsx` (or a role-aware single nav component) since Management is a distinct role with a distinct route tree, not a permission overlay on the existing admin nav.

### 7.6 Supporting pieces not yet in the codebase

- **User/role management screens don't currently exist** — there's no visible admin UI for creating users or changing roles (accounts appear to be provisioned via `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars and direct DB seeding, per `.env.example`). Before maker-checker can go live, build a minimal `app/admin/users` (or a separate ultra-restricted "Owner"-only screen, since whoever assigns MANAGEMENT/ADMIN roles is itself a role-separation-sensitive action) to provision Management accounts and enforce the "never held the other role" rule from 7.1.
- **Notifications**: Management users need to know a request is waiting — at minimum an email on submission (there's no existing email-sending code found in the reviewed files; this may need a new integration, e.g. SMTP or a transactional email provider — flag as a dependency to confirm during implementation).
- **Audit trail**: every `maker_checker_requests` row is itself a complete audit record (who submitted what, who decided, when, why) — this should supersede, not duplicate, the existing inconsistent `audit_events` logging (§1, §3) for these four action types specifically. Recommend still writing one `audit_events` row per decision (`action='MAKER_CHECKER_DECISION'`) for consistency with the rest of the system's audit surface, cross-referencing `maker_checker_requests.id` in `event_data`.

### 7.7 Migration & rollout sequence

Because this is a hard cutover (no flag), sequencing matters — Admins must not be able to reach a state where an in-scope action has no path to completion:

1. **Schema migration**: add `MANAGEMENT` to `users.role`, add `PENDING_MANAGEMENT_APPROVAL` to `affiliate_applications.status`, create `maker_checker_requests`. Ship this first, in a release that does *not* yet change any Admin-facing behavior — pure additive schema.
2. **Build and ship `app/admin/users`** (or Owner-only equivalent) for role provisioning — needed before any real person can be promoted to MANAGEMENT.
3. **Provision Management accounts** in the target environment (staging first, then production) — this is an operational step the user/team does, not code; confirm at least one Management user exists and is confirmed disjoint from all existing Admin accounts before proceeding.
4. **Build the four maker/checker flow changes** (7.3) behind normal code review — since there's no flag, these land in a single coordinated release, tested end-to-end in staging with real Management accounts before promotion to production.
5. **Cut over in one release**: deploy schema + code together; the moment this release is live, all four in-scope actions require Management sign-off with no fallback path. Communicate the cutover date to the operations team in advance so Admin users aren't caught by surprise mid-transaction (e.g. don't cut over while a large payout batch is half-prepared).
6. **Post-cutover verification**: confirm the `chk_mc_separation` constraint is active, confirm at least 2 Management accounts exist (single point of failure risk if only one Management user exists and is unavailable), and confirm the existing single-admin approval paths (`admin/collections/[id]/approve`, `admin/payouts/[id]`, `admin/payouts/batch`, the `APPROVED` branch of `admin/applications/[id]`, `adjudicateDealAppeal`) are fully decommissioned, not just superseded — leaving the old direct-approval code paths reachable would defeat the entire control.

### 7.8 Fixes from §6c that are hard prerequisites for this design to be meaningful

- **#2** (transaction-wrapping `approveDealCollection()`/`settleConsolidatedPayout()`) — must ship with or before 7.3(1)/(2), since Management's approval is meaningless if the underlying write can still partially fail.
- **#6** (payout re-flip guard) — the single-advice payout route is being rewritten in 7.3(2) anyway; build the guard in from the start rather than retrofitting.
- **#8** (hardcoded `PROPOSAL_SENT` on appeal approval) — must be fixed as part of 7.3(4); a checker approving a decision that silently does something other than what was shown to them defeats the purpose of having a checker.
- **#5** (users.status desync on RETRACTED/RETRACTION_ACKNOWLEDGED) — not strictly blocking, but should land in the same release window since 7.6's new user-management screen will surface `users.status` directly and shouldn't display a known-wrong value.

---

## 6. Priority Recommendations for the Improvement/Migration Work

Ordered by severity, consolidating all review passes (backend state machine, UI/button-state audit, affiliate-status/commission-rights audit, maker-checker design — full detail in §6c and §7 above):

1. **Build maker-checker between Admin and Management** (§7) — the largest structural piece of work, and it absorbs/forces several other fixes as hard prerequisites (see §7.8: the transaction-wrapping fix, the payout re-flip guard, and the hardcoded-appeal-stage bug all must land as part of this build, not separately). Sequence per §7.7 — schema first, role-provisioning UI second, the four flow changes third, single coordinated cutover last.
2. **Decide and implement the vesting/eligibility model** (§6b, Finding 5) — this is a business-rule gap, not just a code bug: today nothing distinguishes "commission already earned" from "commission that would be earned in future on a still-open deal." Needs an explicit decision (e.g., snapshot affiliate status at deal-collection-approval time) before the code can be considered correct against the stated intent. Independent of maker-checker but should land in the same phase, since the new Management approval screen for collections (§7.3.1) is the natural place to display vesting eligibility to the checker.
3. **Add a status guard to `findUplineChain()`/`approveDealCollection()`** so a suspended/terminated/retracted affiliate (at any upline level) stops accruing *new* commissions once the vesting rule from #2 says they should — while still paying out what's already vested.
4. **Fix `users.status` desync on RETRACTED/RETRACTION_ACKNOWLEDGED** (§6b, Finding 2) — one-line fix in `app/api/admin/applications/[id]/route.ts`; also called out in §7.8 since the new user-management screen (§7.6) will surface this field directly.
5. **Close the two ungated portal routes** — add an affiliate-status check to `prospects/[id]/step/route.ts` and `prospects/[id]/appeal/route.ts` so non-active affiliates can't act on existing deals.
6. **Gate `ToggleTestModeButton`** off immutable/approved/paid records — currently allows corrupting the test/production classification of money that has already moved.
7. **Unify deal creation** — route `portal/leads` and the admin `CREATE_DEAL` action through the same exclusivity-check + `logFunnelStep()` path `portal/prospects` already uses.
8. **Add disabled/loading state to every transition-triggering submit button** — systemic gap, best fixed once via a shared submit hook; do this pass across both Admin and the new Management screens together (§7.5) rather than twice.
9. **Collapse the two test-mode mechanisms** (`is_test` column + `admin_data_mode` cookie/setting) into one source of truth; audit `is_test` propagation consistency across insert paths.
10. **Clean up dead code**: non-existent-enum status branches (`NEGOTIATION`, `CLOSURE_PENDING`, `PARTIALLY_COLLECTED`, `CLIENT_ONBOARDED`, `CLOSED_WON`); `web.config`/`setup-iis.ps1` in the DO repo; gitignore `tsconfig.tsbuildinfo`.
11. **Security hardening** (longer-term): CSRF tokens on state-changing POSTs, rate limiting on login/register, session revocation on password change, decimal-safe commission arithmetic if volume grows. Note: maker-checker itself does not replace CSRF protection — a forged request could still submit or (if Management's session were compromised) approve a request; treat both as separate, additive controls.
12. **Reconfirm `FILE_STORAGE_PROVIDER=spaces` is pinned** in every DO environment as a deploy-blocking check, given the ephemeral-disk data-loss risk if ever left unset.

**Note on items formerly numbered #6/#8** (payout re-flip guard; hardcoded appeal-stage bug): these are not dropped — they're now embedded in §7.3(2) and §7.3(4)/§7.8 as mandatory parts of the maker-checker build, since both routes are being rewritten as part of that work anyway. Building them twice (once standalone, once inside the maker-checker rebuild) would be wasted effort.

---

### Files most relevant for a focused code review
`lib/funnel.ts` (core state machine), `lib/auth.ts`, `lib/settings.ts`, `lib/storage.ts` (DO only), `lib/db.ts`, `app/api/admin/deals/[id]/collect/route.ts`, `app/api/admin/collections/[id]/{approve,reject}/route.ts`, `app/api/admin/payouts/{[id],batch}/route.ts`, `app/api/portal/{prospects,leads}/route.ts`, `app/api/admin/applications/[id]/route.ts`, `app/api/profile/{update,retract}/route.ts`, `.do/app-production.yaml`, `admin/payouts/PayoutsView.tsx`, `admin/ToggleTestModeButton.tsx`, `admin/deals/[id]/DealDetailView.tsx`.
