# FolioDesk — Affiliate Engine Analysis & Improvement Plan

Consolidated engineering reference: full end-to-end read of the codebase at `D:\Websites\FolioDesk\WebsiteBuild` (on git branch `main`) and its DigitalOcean-hardened branch `codex/foliodesk-digitalocean` (checked out at `D:\Websites\FolioDesk\GITHubDigitalOcean\FolioDesk\WebsiteBuild`), the MySQL schema, every API route and UI component implementing the affiliate/sales/commission workflow, plus a full maker-checker (Admin/Management) implementation design. This is the single source of truth for the improvement and CICD execution work tracked under `FolioDesk/CICD/`.

**Terminology used consistently throughout this document**: "maker-checker" is the canonical term for the two-person approval control described here (a submitter/"maker" and a separate approver/"checker"). Where earlier drafts or UI copy used "4-eyes," "dual control," "second sign-off," or "Management Approval," those all refer to the same maker-checker concept defined in §7.

**File path convention**: all paths are given relative to the WebsiteBuild root (e.g. `app/api/admin/deals/route.ts`, `lib/funnel.ts`), using forward slashes, regardless of which branch/working-tree copy is being discussed. Where a path differs between `main` and `codex/foliodesk-digitalocean`, both are shown explicitly.

---

## 0. System shape

Next.js (App Router) monolith, MySQL 8.4, three portals:
- **Public marketing site** (`app/page.tsx`, `pricing`, `solutions`, `roles`, `demo`, `platform`)
- **Affiliate self-service portal** (`app/portal/*`) — registration, dashboard, prospect/deal tracking, profile
- **Admin console** (`app/admin/*`) — applications, approvals, deals, collections, payouts, settings

Data model (`db/mysql-schema.sql`): `users`, `affiliate_applications`, `application_status_history`, `affiliate_profile_updates`, `onboarded_customers`, `deal_pipeline`, `deal_funnel_steps`, `deal_closure_logs`, `deal_collections`, `payment_advices`, `payout_batches`, `packages`, `system_settings`, `audit_events`, `sessions`, `countries`/`states`.

**Git topology** (established during CICD planning, §9): both codebases are branches of one repo, `github.com/firedancerx/websites.git`. `main` = the IIS-era codebase (commit `d569bd9`, "rectified payment workflow"). `codex/foliodesk-digitalocean` = `main` + one commit (`d830690`, "harden DigitalOcean migration readiness"). This means all improvement work lands as commits on top of `main`, then is reconciled into the DO branch via merge/rebase — not hand-duplicated between folders.

---

## 1. Affiliate Application Lifecycle

**Enum** (`affiliate_applications.status`): `SUBMITTED, UNDER_REVIEW, INFORMATION_REQUIRED, CORRECTION_REQUIRED, APPROVED, REJECTED, SUSPENDED, TERMINATED, RETRACTED, RETRACTION_ACKNOWLEDGED`

| Transition | Trigger | File | Notes |
|---|---|---|---|
| — → `SUBMITTED` | Applicant registers | `app/api/register/route.ts` | Generates 9-char `affiliate_code` via `generateAffiliateCode()` (`lib/auth.ts`), uniqueness retry loop capped at 10 attempts with **no fallback on exhaustion**. Uploads ID doc + "holding ID" proof to local disk (`main`) / DO Spaces (`codex/foliodesk-digitalocean`, via `lib/storage.ts`). Wrapped in a DB transaction (`conn.beginTransaction/commit/rollback`) — correct pattern. Logs `application_status_history` + `audit_events` (`APPLICATION_SUBMITTED`). |
| `SUBMITTED/UNDER_REVIEW/etc` → any allowed status | Admin decision | `app/api/admin/applications/[id]/route.ts` | Single generic endpoint, `ADMIN`-only (`requireAdmin()`), status whitelisted via an `allowed` Set matching the DB enum. `APPROVED` sets `users.role='AFFILIATE'`, `users.status='ACTIVE'`. `SUSPENDED`/`TERMINATED` set `users.status='SUSPENDED'`. `decided_at` set only for `{APPROVED,REJECTED,SUSPENDED,TERMINATED,RETRACTION_ACKNOWLEDGED}`. **Not transaction-wrapped** — three sequential `db().execute()` calls. |
| `CORRECTION_REQUIRED`/`INFORMATION_REQUIRED`/`UNDER_REVIEW`/`SUBMITTED` → `SUBMITTED` | Applicant edits profile | `app/api/profile/update/route.ts` | Forces status back to `SUBMITTED`, clears `flag_id_doc_unclear`/`flag_holding_id_unaccepted`, resets `submitted_at`. Logs history only when previous status was `CORRECTION_REQUIRED`/`INFORMATION_REQUIRED`. |
| `APPROVED` + profile edit → shadow queue | Applicant edits after approval | `app/api/profile/update/route.ts` | Edits do **not** apply live; upserted into `affiliate_profile_updates` (`status='PENDING_APPROVAL'`) — a proper eKYC-style re-verification queue, good design. |
| `affiliate_profile_updates.PENDING_APPROVAL` → `APPROVED`/`REJECTED` | Admin | `app/api/admin/profile-updates/[id]/route.ts` | `APPROVE` copies fields onto `affiliate_applications` + updates `users.full_name` — two related writes, **not transaction-wrapped**. |
| any (not already RETRACTED*) → `RETRACTED` | Affiliate self-service | `app/api/profile/retract/route.ts` | Instant, no approval gate. Sets `decided_at=NOW()`. |
| `RETRACTED` → `RETRACTION_ACKNOWLEDGED` | Admin | `app/api/admin/applications/[id]/route.ts` (same generic endpoint) | Historical commissions documented as still honored in note text only — **not enforced in code** (see §6, Finding 5, for the full vesting-model gap). |
| (reinstatement) → `SUBMITTED` | Logged-in user, `isReinstatement=1` flag | `app/api/register/route.ts` | Reuses existing user/application row, resets `decided_at=NULL`. This is the one admin-adjacent flow that **is** transaction-wrapped. |

**Side effects across the lifecycle**: affiliate_code generation, role escalation, file uploads (local disk on `main`, DO Spaces on `codex/foliodesk-digitalocean`), dual audit logging (`application_status_history` + `audit_events`) — inconsistently applied (eKYC approve/reject and retract log only `audit_events`).

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
- Direct admin override: `app/api/admin/deals/route.ts` (`action=UPDATE_STATUS`) — free-form `targetStatus` (string equality checks, not enum-validated against the type), auto-acknowledges pending steps, inserts synthetic `ACKNOWLEDGED` step. Also handles invoice issuance (`invoice_number`, `invoiced_at`, `invoice_target` PROSPECT/AFFILIATE).

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

- **`is_test` flag**: present on nearly every business table. Pattern `isTestVal = isTest !== undefined ? isTest : 1` appears repeatedly — omitting the flag defaults new records to **test** (safe default), but propagation is inconsistent: `app/api/portal/leads/route.ts` never sets it explicitly (relies on DB column default) while `app/api/portal/prospects/route.ts` does pass it through — a latent source of test-data/live-data classification drift.
- **`app/api/admin/toggle-test-mode/route.ts`** — generic entity toggler (`entityType`: `affiliate|deal|collection|payment_advice`) mapped to a hardcoded table-name lookup, then `UPDATE ${tableName} SET is_test=? WHERE id=?` — string-interpolated table name, currently safe only because the entity-type enum is checked before lookup; flag as a pattern risk if the whitelist is ever extended carelessly.
- **Separate "admin data mode" toggle** (`TEST|ACTUAL|ALL`) — `lib/settings.ts` (`getAdminDataMode`/`updateAdminDataMode`), stored in **both** `system_settings` and mirrored into an `admin_data_mode` cookie — two sources of truth for one setting, can drift.
- **Auth/session** (`lib/auth.ts`): PBKDF2 (210,000 rounds, SHA-512, 32-byte key), per-user random salt, stored `pbkdf2$rounds$salt$hash`. Sessions: random 32-byte token, only SHA-256 hash stored in `sessions.token_hash`, 7-day expiry, `fd_session` httpOnly cookie (`sameSite:"lax"`). Roles: `APPLICANT`/`AFFILIATE`/`ADMIN`, gated by a simple `requireAdmin()` boolean check — no granular permissions. **No CSRF protection** on any state-changing POST endpoint beyond `sameSite:lax`. Password change doesn't revoke other active sessions.
- **Audit pattern**: two parallel logs — `application_status_history` (application-specific) and generic `audit_events` (`actor_user_id, action, entity_type, entity_id, event_data` JSON). Coverage inconsistent across endpoints; payout single-advice route and step-review write neither.

---

## 5. `main` → `codex/foliodesk-digitalocean` Branch Diff (IIS → DigitalOcean hosting adaptation)

### Environment & config
- `main`'s `.env.example`: 6 vars — plain `DATABASE_URL` (root user), `SESSION_SECRET`, `ADMIN_EMAIL/PASSWORD/NAME`, `NEXT_PUBLIC_SITE_URL`.
- `codex/foliodesk-digitalocean`'s `.env.example` adds: `DATABASE_SSL_MODE`, `DATABASE_CA_CERT`, `DATABASE_POOL_SIZE`, and a full Spaces block (`FILE_STORAGE_PROVIDER`, `SPACES_ENDPOINT` = `https://sgp1.digitaloceanspaces.com`, `SPACES_REGION`, `SPACES_BUCKET`, `SPACES_ACCESS_KEY`, `SPACES_SECRET_KEY`). `DATABASE_URL` uses a dedicated `foliodesk_app` DB user, not root.

### Dependencies
- DO branch adds `@aws-sdk/client-s3@3.1131.0` and pins `packageManager: pnpm@11.19.0`.
- MySQL driver unchanged (`mysql2@3.14.5`) on both branches.
- DO branch adds `db:verify`, `db:reconcile`, `db:test-migration` scripts; drops the `--env-file=.env.local` flag on `db:migrate` (platform injects env vars directly).

### Infrastructure / deployment
- DO branch adds `.do/app-production.yaml` and `.do/app-staging.yaml` (App Platform specs). No Dockerfile/Procfile — native `node-js` buildpack.
- Key production spec fields:
  - `build_command: corepack enable && pnpm install --frozen-lockfile && pnpm run build`
  - `run_command: pnpm run start`, `http_port: 8080`, `instance_count: 2`, `instance_size_slug: apps-s-1vcpu-1gb`
  - `health_check.http_path: /foliodesk/api/health` (new `app/api/health` route, DO branch only)
  - `PRE_DEPLOY` job `schema-migrate` runs `pnpm run db:migrate && pnpm run db:verify` before the web service deploys
  - Attached managed DB: `engine: MYSQL, version: "8.4"` via `${db.DATABASE_PRIVATE_URL}` / `${db.CA_CERT}`
  - `DATABASE_SSL_MODE: verify-ca` in both staging/prod
  - Staging vs. production: `instance_count 1` vs `2`, `DATABASE_POOL_SIZE "10"` vs `"20"`, staging auto-deploys on push, production requires manual deploy from `main` (note: the DO app-spec's own branch reference — deploy-from-"main" — is unrelated to this document's git-branch discussion; it refers to the DO App Platform's configured deploy source)
- **Cruft**: `web.config` and `setup-iis.ps1` remain, byte-identical, on the DO branch — dead files, harmless, should be pruned.

### Database
- Both branches still use MySQL (no Postgres migration). Schema is functionally identical between branches (minor column reordering only).
- `lib/db.ts` is the real adaptation point: DO branch adds `sslConfig()` (reads `DATABASE_SSL_MODE`/`DATABASE_CA_CERT`, defaults `verify-ca` in production, throws if `DATABASE_CA_CERT` missing under `verify-ca`), connection pooling via `DATABASE_POOL_SIZE` (default 10), `waitForConnections`, `enableKeepAlive`. `main`'s version is a bare `mysql.createPool(process.env.DATABASE_URL)` — appropriate for each hosting model.
- New `types/database.d.ts` (DO branch only) — `DatabaseRow`/`DatabaseResult`/`DatabaseResultRow<T>` type aliases wrapping `mysql2/promise` types, likely added to satisfy stricter TS checking once the AWS SDK types entered the project.

### File storage / uploads — correctly migrated
- `main`: `app/api/register/route.ts` imports `writeFile`/`mkdir` from `node:fs/promises`, writes ID-verification uploads to local disk.
- DO branch: same route imports `saveUpload`/`validateUpload` from new `lib/storage.ts`, which provider-switches: `FILE_STORAGE_PROVIDER=spaces` → `@aws-sdk/client-s3` against DO Spaces with path-traversal-guarded object keys; `FILE_STORAGE_PROVIDER=local` → falls back to `public/uploads` with the same guard.
- Both app-spec files correctly set `FILE_STORAGE_PROVIDER=spaces` for real deployments.
- **Operational risk to flag**: DO App Platform instance disks are ephemeral. If this env var is ever omitted or misconfigured back to `local` in a live deployment, uploaded ID documents will silently write to ephemeral storage and vanish on the next redeploy/restart. Treat as a non-negotiable env var in any future config change.

### Other migrated items
- New `lib/errors.ts` (DO branch only) — small AWS-SDK-error-shape normalization helpers.
- New `app/api/health` route (DO branch only), required by App Platform health checks.
- `README.md`: DO branch removes `main`'s documented hardcoded default admin password — a real security-hygiene improvement.
- `tsconfig.tsbuildinfo` present as a committed build artifact in the DO branch's working tree — should be gitignored if not already.

---

## 6. Cross-Cutting Audits: UI State Machine, Maker-Checker Gap, Affiliate-Status/Commission-Rights

### 6.1 UI State-Machine Consistency Audit (button enablement vs backend status)

Every admin/portal React component that triggers a state transition, checked for whether each control's enabled/disabled/visible condition actually matches the record's current status.

| File | Control | Transition | Enablement condition | Problem |
|---|---|---|---|---|
| `app/admin/payouts/PayoutsView.tsx` | "Disburse Payment" | `PENDING_DISBURSEMENT → PAID` | `{!isPaid && <button>}` where `isPaid = payout_status === "PAID"` | **Only excludes PAID, never CANCELLED.** A CANCELLED advice still shows the Disburse button — combined with the backend's missing re-flip guard (§3), this actively invites re-disbursing a cancelled advice. |
| `app/admin/payouts/PayoutsView.tsx` | "Confirm Individual Disbursement" | same | Plain `<button type="submit">`, no disabled/loading state | **Double-submit risk** on the single highest-risk, irreversible action in the system (bank disbursement), with no server-side idempotency guard to catch the duplicate either. |
| `app/admin/collections/CollectionsApprovalView.tsx` | Approve/Reject | `PENDING_APPROVAL → APPROVED/REJECTED` | `isPending ? <buttons> : <span>Closed</span>` | Correctly gated — good reference example. |
| `app/admin/collections/CollectionsApprovalView.tsx` | Approve/Reject modal submit | same | No disabled-while-submitting state | Double-submit risk. |
| `app/admin/approvals/ApprovalsView.tsx` | Approve/Reject (all 3 categories: applications, profile updates, collections) | various | Rendered unconditionally for every row passed in; no client-side status re-check, no disabled-while-submitting | Relies entirely on the parent query pre-filtering to pending rows; a stale cache or race would still render live submit buttons. Double-submit risk on all three forms. |
| `app/admin/AdminNetworkView.tsx` | Approve/Reactivate, Suspend, Terminate, Reject, Acknowledge (retraction) | application status transitions | Explicit per-status allow-lists, e.g. Suspend: `status === "APPROVED"`; Terminate: `status === "APPROVED" \|\| "SUSPENDED"`; Reject: `["SUBMITTED","UNDER_REVIEW","INFORMATION_REQUIRED","CORRECTION_REQUIRED"].includes(status)` | Mostly correct and the best-gated file in the codebase. One open question: REJECTED is not excluded from re-Approval — may be an intentional reversal path, should be confirmed as designed rather than accidental. |
| `app/admin/deals/DealsView.tsx` / `app/admin/deals/[id]/DealDetailView.tsx` | Suspend, Abort, Issue Invoice, Record Collection | deal_pipeline transitions | Explicit status-list conditions (e.g. Invoice: `status==="CONTRACT_SIGNED" && !invoice_number`) | Correctly gated. |
| `app/admin/deals/[id]/DealDetailView.tsx` | "Re-issue/Replace Invoice" | re-issue on an already-invoiced deal | Shown whenever invoiced and not fully finalized, **including after PARTIAL_COLLECTED** | Allows changing the invoice number on a deal that already has approved, **immutable** collection records referencing the old invoice number — no warning that this desyncs from locked historical records. |
| `app/admin/deals/[id]/DealDetailView.tsx` | Invoice-target toggle (PROSPECT/AFFILIATE billing) | — | `disabled={invoiceTarget === currentValue}` only — **no deal-status check at all** | Sits outside the "fully finalized" conditional block, so the billing target can be flipped even on a FULLY_COLLECTED/closed deal after money has already moved. |
| `app/admin/deals/[id]/DealDetailView.tsx` | "Adjudicate Appeal" | appeal decision | Dropdown defaults to Approve; submits to a handler that hardcodes the resulting stage to `PROPOSAL_SENT` (§2) | **UI compounds the known backend bug** — nothing tells the admin the deal will be reset to PROPOSAL_SENT regardless of its actual prior stage; an admin approving an appeal on a CONTRACT_SIGNED deal gets a silent regression with no warning. |
| `app/admin/ToggleTestModeButton.tsx` | Toggle `is_test` on affiliate/deal/collection/advice | — | **No status check whatsoever** — wired into rows in `CollectionsApprovalView` and `PayoutsView` regardless of `is_immutable`/`approval_status`/`payout_status` | Highest-severity UI finding: an admin can flip a **locked, approved, immutable collection** or a **PAID payment advice** between test/production classification after the fact, silently corrupting real-vs-test reporting on money that has already moved. Only guard is a client `confirm()` dialog. |
| `app/portal/RetractButton.tsx` | "Confirm Retraction" | → RETRACTED | No status check in the component itself (relies on caller) | Correctly has a `disabled={submitting}` guard — the **only** transition control in the codebase with proper double-submit protection. |
| `app/portal/ProfileEditForm.tsx` | Field-level edit enablement | — | `canEditUpline`/`canEditUploads` = `CORRECTION_REQUIRED \|\| INFORMATION_REQUIRED` (+ uploads also allow APPROVED) | Correct, granular gating — good reference example. |
| `app/portal/ProfileEditForm.tsx` | Submit button | — | Only password-validation errors disable it — **never gated on affiliate status** | A RETRACTED or SUSPENDED affiliate can still submit this form client-side (see §6.3 Finding 3 for the matching server-side gap). |
| `app/admin/applications/[id]/correction/page.tsx` | Prospects pipeline status badges | display only | Hardcodes labels for `NEGOTIATION`, `CLOSURE_PENDING`, `PARTIALLY_COLLECTED` | **None of these three strings exist in the real `deal_pipeline.status` enum** (correct spelling is `PARTIAL_COLLECTED`) — dead code, evidence the UI was written against an earlier/hypothetical richer status set than the backend implements. |

**Maker-checker / role-handoff gap — the biggest structural finding of this audit.** There is no distinct "management" tier anywhere in the code today. Every approval action is gated purely by a single flat `requireAdmin()` check. Yet the UI copy repeatedly implies a maker-checker control that doesn't exist: `DealsView.tsx` ("Submit for Management Approval"), `CollectionsApprovalView.tsx` ("Awaiting Mgt Approval"), `ApprovalsView.tsx` ("awaiting Superadmin review"), `admin/applications/[id]/correction/page.tsx` ("As superadmin, you may acknowledge this retraction"). The same admin account can submit a collection, approve it, and disburse the resulting payout, alone, with no second sign-off anywhere — this gap is what §7 designs a fix for.

**Double-submit / race-condition risk — systemic, not isolated.** Every transition-triggering form in the codebase except `RetractButton.tsx` and `ToggleTestModeButton.tsx` submits via a plain `<button type="submit">` with no disabled/loading state during the request. Worth fixing once, centrally (a shared submit-button/hook), rather than file by file.

### 6.2 Affiliate-Status vs Commission-Earning-Rights Audit

Business intent: an affiliate should keep the right to earn/receive commissions on deals already in motion before their affiliate status changed, while being correctly blocked from taking *new* affiliate actions once suspended/terminated/retracted. Finding: **the "keep paying old commissions" half works, but only because nothing checks status at payout time at all — and the "block new actions" half is inconsistently implemented, with real gaps.**

**Finding 1 — Upline commission chain is completely status-blind.** `findUplineChain()` (`lib/funnel.ts`) fetches `status` on the direct affiliate, upline L1, and upline L2 rows — but never reads or filters on it:

```ts
const [directRows] = await db().execute<any[]>(
  "SELECT id, user_id, legal_name, affiliate_code, upline_affiliate_code, status FROM affiliate_applications WHERE id=? LIMIT 1", [directAffiliateId]);
...
const [l1Rows] = await db().execute<any[]>(
  "SELECT id, user_id, legal_name, affiliate_code, upline_affiliate_code, status FROM affiliate_applications WHERE affiliate_code=? LIMIT 1",
  [directAffiliate.upline_affiliate_code.trim().toUpperCase()]);
```

`approveDealCollection()` then unconditionally creates a `payment_advices` row for direct/L1/L2 if present — no status gate anywhere in the chain. A SUSPENDED, TERMINATED, or RETRACTED affiliate **at any level of the upline** still receives payment advices on every approval, indefinitely.

**Finding 2 — `users.status` and `affiliate_applications.status` silently desync.** `app/api/admin/applications/[id]/route.ts`:

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

Every status string other than the literal `SUSPENDED`/`TERMINATED` falls through to `"ACTIVE"` — including RETRACTED and RETRACTION_ACKNOWLEDGED, which the code's own decision-note text describes as "read-only mode."

**Finding 3 — Portal routes: inconsistent status gating, two real gaps.**

| Route | Status check | Gap |
|---|---|---|
| `app/api/portal/leads/route.ts` | Explicit blocklist: `RETRACTED, RETRACTION_ACKNOWLEDGED, SUSPENDED, TERMINATED` | Present but implicit/negative rather than `=== 'APPROVED'` — SUBMITTED/UNDER_REVIEW would also incorrectly pass. |
| `app/api/portal/prospects/route.ts` | Same blocklist | Same minor gap. |
| `app/api/portal/prospects/[id]/step/route.ts` (funnel-step submission) | **None** — only checks login + deal ownership | **Real gap**: a SUSPENDED/TERMINATED/RETRACTED affiliate can still log new funnel steps on their existing deals. |
| `app/api/portal/prospects/[id]/appeal/route.ts` | **None** — same pattern | **Real gap**: a non-active affiliate can still submit force-closure appeals. |

**Finding 4 — No status check anywhere at payout time.** Neither `settleConsolidatedPayout()` (batch) nor `app/api/admin/payouts/[id]/route.ts` (single-advice, bypasses the lib function with a raw `UPDATE`) check the beneficiary's current affiliate status. Payouts always proceed on any `PENDING_DISBURSEMENT` advice — matching the desired "always honor already-earned commissions" behavior, but only because the code never checks, not by design.

**Finding 5 — No vesting model exists; everything is a point-in-time check.** There is no `vested_at` field, no snapshot of "affiliate was APPROVED when this deal was opened," and no lifecycle distinction between (a) commission already vested on an approved collection — should always pay regardless of a later status change — and (b) commission that would be created by a *future* collection on a deal still open when status changes — arguably should require good standing. The only lifecycle-aware mechanism anywhere is the commission-*rate* lock on `deal_collections`, which locks the rate, not eligibility. Case (a) is accidentally satisfied (nothing blocks it); case (b) is **not implemented** at all — a terminated affiliate's still-open deal can keep progressing (funnel steps unguarded, collection approval unguarded, payout unguarded) all the way to a paid commission. **This is a business-rule gap requiring an explicit decision** (e.g., snapshot affiliate status at deal-collection-approval time), tracked as Finding F-04 (§6.3).

### 6.3 Consolidated Finding/Fix Register

Single authoritative list — supersedes any severity/priority language used elsewhere in this document. Every fix tracked in `CICD/todo.json` uses the `Finding ID` column below as its cross-reference key (stable identifiers, safe against renumbering).

| Finding ID | Area | Finding | File(s) | Severity |
|---|---|---|---|---|
| F-01 | Money integrity | No transaction wrapping on `approveDealCollection()` / `settleConsolidatedPayout()` | `lib/funnel.ts` | High |
| F-02 | Money integrity | Single-advice payout route has no re-flip guard (PAID/CANCELLED can be toggled repeatedly) | `app/api/admin/payouts/[id]/route.ts` | High |
| F-03 | UI/backend mismatch | Disburse button only excludes PAID, not CANCELLED — UI actively invites re-disbursing a cancelled advice | `app/admin/payouts/PayoutsView.tsx` | High |
| F-04 | Vesting/eligibility | No status check anywhere in `findUplineChain()` / `approveDealCollection()` / payout routes — no distinction between vested and future commission | `lib/funnel.ts`, both payout routes | High — needs an explicit business decision, then implementation |
| F-05 | Status sync | `RETRACTED`/`RETRACTION_ACKNOWLEDGED` incorrectly leave `users.status='ACTIVE'` | `app/api/admin/applications/[id]/route.ts` | High |
| F-06 | New-action gating | Funnel-step submission and appeal submission have zero affiliate-status check | `app/api/portal/prospects/[id]/step/route.ts`, `.../appeal/route.ts` | High |
| F-07 | Data integrity | `ToggleTestModeButton` allows flipping `is_test` on immutable/approved/paid financial records with no status guard | `app/admin/ToggleTestModeButton.tsx` | High |
| F-08 | Correctness bug | Appeal approval hardcodes deal status to `PROPOSAL_SENT` regardless of actual prior stage — UI gives no warning | `lib/funnel.ts` (`adjudicateDealAppeal`), `app/admin/deals/[id]/DealDetailView.tsx` | High |
| F-09 | Process integrity | Three different deal-creation entry points with three different validation rule sets | `app/api/portal/prospects/route.ts`, `app/api/portal/leads/route.ts`, `app/api/admin/deals/route.ts` | Medium-High |
| F-10 | Governance | "Management Approval"/"Superadmin" UI copy implies a maker-checker control that doesn't exist — flat single-admin approval on every financial action including payout disbursement. **Resolved by design in §7** (decision made: build real maker-checker, strict separation, hard cutover). | `app/admin/deals/DealsView.tsx`, `app/admin/collections/CollectionsApprovalView.tsx`, `app/admin/approvals/ApprovalsView.tsx`, `app/admin/applications/[id]/correction/page.tsx` | High — design resolved, implementation tracked in §7/§8 |
| F-11 | UI robustness | No disabled/loading state on nearly every transition-triggering submit button — systemic double-submit risk, worst on payout disbursement | Nearly every admin/portal transition form except `RetractButton.tsx`, `ToggleTestModeButton.tsx` | Medium |
| F-12 | Data integrity | Invoice re-issue and invoice-target toggle both allowed on deals with already-approved, immutable collections | `app/admin/deals/[id]/DealDetailView.tsx` | Medium |
| F-13 | Code hygiene | Dead status branches referencing a non-existent enum (`NEGOTIATION`, `CLOSURE_PENDING`, `PARTIALLY_COLLECTED`, `CLIENT_ONBOARDED`, `CLOSED_WON`) | `app/admin/applications/[id]/correction/page.tsx`, `lib/funnel.ts` | Low-Medium |
| F-14 | Test/prod hygiene | `is_test` propagation inconsistent across insert paths; separate `admin_data_mode` cookie/setting can drift from the `is_test` column mechanism | `app/api/portal/leads/route.ts`, `lib/settings.ts` | Low-Medium |
| F-15 | Security | No CSRF protection, no rate limiting on login/register, no session revocation on password change | `lib/auth.ts` and all state-changing POST routes | Medium (longer-term). **Note**: maker-checker (§7) does not replace CSRF protection — a forged request could still submit, or (if a Management session were compromised) approve, a request. Treat as separate, additive controls. |
| F-16 | Code hygiene (DO branch) | `web.config`/`setup-iis.ps1` left over, byte-identical, on `codex/foliodesk-digitalocean`; `tsconfig.tsbuildinfo` committed as a build artifact | DO branch root | Low |
| F-17 | Deployment safety | `FILE_STORAGE_PROVIDER=spaces` must remain pinned in every DO environment — ephemeral instance disks mean uploads silently vanish on redeploy if this is ever left unset/misconfigured | `.do/app-production.yaml`, `.do/app-staging.yaml`, `lib/storage.ts` | Medium — operational control, not a code fix |

---

## 7. Maker-Checker Implementation Design (Admin vs Management)

Decisions locked in by stakeholder sign-off (superseding any earlier "design decision needed" language elsewhere in this document, including F-10 above):
- **MANAGEMENT is a new, distinct role** in the `users.role` enum — not a flag on ADMIN.
- **In scope for mandatory maker-checker sign-off**: (1) collection approval, (2) payout disbursement, (3) affiliate application approval, (4) force-closure appeal adjudication.
- **Strict separation of duties, org-wide**: a user who has ever held ADMIN can never hold MANAGEMENT, and vice versa — not just "not on the same transaction."
- **Hard cutover**: no feature flag. Ships as mandatory in the release that includes it; Management accounts must be provisioned *before* that release goes live.

### 7.1 Role model changes

**Schema** (`db/mysql-schema.sql`):

```sql
ALTER TABLE users
  MODIFY COLUMN role ENUM('APPLICANT','AFFILIATE','ADMIN','MANAGEMENT') NOT NULL DEFAULT 'APPLICANT';
```

**Enforcement of strict separation**: implemented at the application layer (MySQL triggers can't easily express "never in the past"), backed by `audit_events` role-change history. The authoritative rule lives in a new admin user-management endpoint (`app/api/admin/users/route.ts`, does not exist yet — see §7.6), which must reject promoting an ex-ADMIN to MANAGEMENT or an ex-MANAGEMENT to ADMIN, checked against that user's `audit_events` history.

**`requireManagement()`** — new auth helper in `lib/auth.ts`, parallel to the existing `requireAdmin()`:

```ts
export async function requireManagement(): Promise<AuthUser> {
  const user = await currentUser();
  if (!user || user.role !== "MANAGEMENT") throw new UnauthorizedError();
  return user;
}
```

### 7.2 Data model: one generic approval-queue table

Rather than bolting a pending-sub-status onto four different tables (the existing `affiliate_profile_updates` shadow-queue pattern, applied inconsistently in only one place today), introduce one shared table all four in-scope actions route through:

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
  action_payload JSON NOT NULL,            -- the exact decision the maker proposed
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

`chk_mc_separation` (MySQL 8.0.16+ CHECK constraints) is a DB-enforced backstop against the same person submitting and approving a request — defense in depth alongside the application-layer role check.

### 7.3 Per-action flow changes

**(1) Collection approval.** Currently `app/api/admin/collections/[id]/approve/route.ts` calls `approveDealCollection()` directly, ADMIN-only, approving and generating payment advices in one step. New flow: the Admin action inserts a `maker_checker_requests` row (`request_type='COLLECTION_APPROVAL'`) and leaves `deal_collections.approval_status` at `PENDING_APPROVAL` — nothing moves until Management decides. New endpoint `app/api/management/collections/[id]/decide/route.ts` (`requireManagement()`), rejects if `decided_by` would equal `submitted_by`, and only on approval calls `approveDealCollection()` (must include the F-01 transaction-wrapping fix — see §7.8).

**(2) Payout disbursement.** Currently `app/api/admin/payouts/[id]/route.ts` (single) and `app/api/admin/payouts/batch/route.ts` (batch), both ADMIN-only, both write `PAID` directly. New flow: the Admin "Disburse" action creates a `maker_checker_requests` row capturing the exact payload (adviceIds, `manual_bank_tx_ref`, bank details) — `payout_status` stays `PENDING_DISBURSEMENT`. New endpoint `app/api/management/payouts/decide/route.ts` executes the maker's original payload on approval (Management approves-as-submitted or rejects-with-reason; cannot re-author amounts). This rewrite is also where the F-02 immutability guard must be built in, and where **F-03 is fixed as a matching UI change**: once Admin-side disbursement becomes a "submit for Management approval" action instead of a direct write (§7.5), the `PayoutsView.tsx` disburse-button condition is rebuilt from scratch to exclude both `PAID` and `CANCELLED` — the F-03 gap doesn't need a separate standalone fix because the button it affects no longer exists in its current form after this rewrite.

**(3) Affiliate application approval.** Currently `app/api/admin/applications/[id]/route.ts`, one generic ADMIN-only endpoint handling all nine transitions. New flow: **only the `APPROVED` transition** requires Management sign-off (the other eight are reversible, non-financial, or protective actions where a second sign-off adds delay without a matching control benefit). Admin action for decision=`APPROVED` creates a `maker_checker_requests` row instead of calling the status-update SQL directly; application status moves to a new intermediate status (§7.4). Management approves → existing APPROVED-transition logic runs. Management rejects → application reverts to `UNDER_REVIEW` with the reason logged.

**(4) Force-closure & appeal adjudication.** Currently `app/api/admin/deals/[id]/closure/route.ts`, ADMIN-only. Maker-checker applies to **adjudication of an appeal** specifically (the decision with direct commission-eligibility consequences per §6.2), not the initial force-close action (which is the protective action that triggers the appeal right — gating it would let a bad-faith admin sit on force-closures pending a checker). Admin reviewing an `APPEAL_SUBMITTED` deal creates a `maker_checker_requests` row with their proposed decision. Management approves → `adjudicateDealAppeal()` executes — this is also where the F-08 hardcoded-`PROPOSAL_SENT` bug must be fixed, since Management needs to see and confirm the *actual* target stage, not a hardcoded one.

### 7.4 Schema addition needed for application approval gating

`affiliate_applications.status` needs one new value — "Admin has recommended approval, awaiting Management sign-off" — distinct from `UNDER_REVIEW` so the Admin review queue and Management approval queue don't collide:

```sql
ALTER TABLE affiliate_applications
  MODIFY COLUMN status ENUM(
    'SUBMITTED','UNDER_REVIEW','INFORMATION_REQUIRED','CORRECTION_REQUIRED',
    'PENDING_MANAGEMENT_APPROVAL',
    'APPROVED','REJECTED','SUSPENDED','TERMINATED','RETRACTED','RETRACTION_ACKNOWLEDGED'
  ) NOT NULL DEFAULT 'SUBMITTED';
```

A bespoke status (rather than routing purely through `maker_checker_requests.status`) is warranted here because the affiliate-facing portal already displays `affiliate_applications.status` directly to the applicant (§1) — they need a visible, correctly-labeled state rather than silently sitting in `UNDER_REVIEW` while a shadow table changes underneath them.

### 7.5 UI changes

- **New `/management` route tree**, structurally mirroring `/admin` but scoped to `requireManagement()`: `app/management/queue/page.tsx` (unified inbox across all four request types), plus type-specific detail views reusing existing Admin components in a read-only/decision mode (e.g. `DealDetailView.tsx` gets a `mode="management-review"` prop).
- **Admin-side changes**: every affected screen (`CollectionsApprovalView.tsx`, `PayoutsView.tsx`, `app/admin/applications/[id]/...`, `DealDetailView.tsx`'s appeal adjudication) changes its submit action from "commit the transition" to "submit for Management approval," with a "Pending Management Review" badge — replacing the cosmetic-only copy identified in §6.1 with an actually-true state.
- **Both Admin and Management screens get the F-11 disabled/loading submit-button fix** as part of this work, since every form is being touched anyway.
- **New nav**: `ManagementNav.tsx` (or a role-aware single nav component), since Management is a distinct role with a distinct route tree.

### 7.6 Supporting pieces not yet in the codebase

- **User/role management screens don't currently exist** — accounts are provisioned via `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars and direct DB seeding today. Build a minimal `app/admin/users` (or a separately-restricted "Owner"-only screen) to provision Management accounts and enforce the never-held-the-other-role rule from §7.1.
- **Notifications**: Management users need to know a request is waiting — at minimum an email on submission. No existing email-sending code was found in the reviewed files; this may need a new integration (SMTP or a transactional email provider) — flag as a dependency to confirm during implementation.
- **Audit trail**: every `maker_checker_requests` row is itself a complete audit record. Recommend still writing one `audit_events` row per decision (`action='MAKER_CHECKER_DECISION'`) for consistency with the rest of the system's audit surface, cross-referencing `maker_checker_requests.id`.

### 7.7 Migration & rollout sequence

1. **Schema migration**: add `MANAGEMENT` to `users.role`, add `PENDING_MANAGEMENT_APPROVAL` to `affiliate_applications.status`, create `maker_checker_requests`. Ship first, pure additive, no behavior change.
2. **Build `app/admin/users`** for role provisioning.
3. **Provision Management accounts** (staging first, then production) — operational step, not code; confirm ≥1 Management user exists and is disjoint from all existing Admin accounts.
4. **Build the four maker/checker flow changes** (§7.3), tested end-to-end in staging with real Management accounts.
5. **Cut over in one release**: deploy schema + code together. Communicate the cutover date in advance so Admins aren't caught mid-transaction.
6. **Post-cutover verification**: confirm `chk_mc_separation` is active, confirm ≥2 Management accounts exist (single-point-of-failure risk otherwise), confirm the old direct-approval code paths are fully decommissioned, not just superseded.

### 7.8 Fixes from §6.3 that are hard prerequisites for this design

- **F-01** (transaction-wrapping) — must ship with or before §7.3(1)/(2); Management's approval is meaningless if the underlying write can still partially fail.
- **F-02** (payout re-flip guard) — the single-advice payout route is rewritten in §7.3(2) anyway; build the guard in from the start.
- **F-08** (hardcoded `PROPOSAL_SENT`) — must be fixed as part of §7.3(4); a checker approving a decision that silently does something other than what was shown defeats the purpose.
- **F-05** (users.status desync) — not strictly blocking, but should land in the same release window since §7.6's new user-management screen will surface `users.status` directly.

---

## 8. Priority Recommendations (Consolidated)

Ordered by severity/dependency, referencing Finding IDs from §6.3:

1. **Build maker-checker between Admin and Management** (§7) — absorbs F-01, F-02, and F-08 as hard prerequisites (§7.8); resolves F-10. Sequence per §7.7.
2. **Decide and implement the vesting/eligibility model** (F-04, §6.2 Finding 5) — independent of maker-checker but should land in the same phase, since the Management collection-approval screen (§7.3(1)) is the natural place to surface vesting eligibility to the checker.
3. **Add a status guard to `findUplineChain()`/`approveDealCollection()`** (F-04) so a suspended/terminated/retracted affiliate stops accruing *new* commissions per the vesting rule from #2, while still paying what's already vested.
4. **Fix `users.status` desync** (F-05) — small fix, also needed before §7.6's user-management screen ships.
5. **Close the two ungated portal routes** (F-06) — status checks on `prospects/[id]/step` and `prospects/[id]/appeal`.
6. **Gate `ToggleTestModeButton`** (F-07) off immutable/approved/paid records.
7. **Unify deal creation** (F-09) — route all three entry points through the same exclusivity-check + `logFunnelStep()` path.
8. **Gate invoice re-issue and the invoice-target toggle** (F-12) in `DealDetailView.tsx` by deal/collection immutability state — block both once the deal has any approved (immutable) collection attached, so billing records can no longer desync from locked financial history.
9. **Add disabled/loading state to every transition-triggering submit button** (F-11) — one pass across Admin and the new Management screens together.
10. **Collapse the two test-mode mechanisms** (F-14).
11. **Clean up dead code** (F-13, F-16).
12. **Security hardening** (F-15, longer-term).
13. **Reconfirm `FILE_STORAGE_PROVIDER=spaces` is pinned** in every DO environment (F-17).

---

## 9. CICD Execution Framework

This document is the design reference for the execution tracked under `FolioDesk/CICD/`:
- `CICD/todo.json` — the machine-readable task list, one entry per Finding ID / implementation step, each with `status` (`pending`/`in_progress`/`done`/`blocked`/`skipped`), the branch, and the file(s) touched.
- `CICD/log.json` — append-only execution log, one entry per action taken (command run, file changed, git operation), timestamped.
- `CICD/migrations/` — SQL migration files, numbered sequentially, one per schema change described in §7.1/§7.2/§7.4.

**Execution order**: all code changes land first on `main` (via a feature branch, not committed directly to `main`), verified there, then reconciled into `codex/foliodesk-digitalocean` by merging/rebasing `main`'s feature branch into that branch — not by hand-copying files, since both are branches of one shared repo history (§0).

**Known constraint on this execution pass**: no Docker/MySQL runtime is reachable from the automation environment used to write this code (confirmed: the shell used for code changes is an isolated sandbox with no path to any Docker daemon, even one running on the host machine). All schema migrations in this pass are therefore **written and statically checked against the existing schema file, but not executed or verified against a live database.** This must be done manually (or via CI) before any release described in §7.7 actually ships. Every `todo.json` entry for a migration step is marked accordingly.

---

### Files most relevant for a focused code review
`lib/funnel.ts` (core state machine), `lib/auth.ts`, `lib/settings.ts`, `lib/storage.ts` (DO branch only), `lib/db.ts`, `app/api/admin/deals/[id]/collect/route.ts`, `app/api/admin/collections/[id]/{approve,reject}/route.ts`, `app/api/admin/payouts/{[id],batch}/route.ts`, `app/api/portal/{prospects,leads}/route.ts`, `app/api/admin/applications/[id]/route.ts`, `app/api/profile/{update,retract}/route.ts`, `.do/app-production.yaml`, `app/admin/payouts/PayoutsView.tsx`, `app/admin/ToggleTestModeButton.tsx`, `app/admin/deals/[id]/DealDetailView.tsx`.
</content>
