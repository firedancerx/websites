-- Migration 004: Add status_before_force_closure to deal_pipeline
-- Plan reference: §7.8 (F-08 fix), §2, §6.1
-- Status: WRITTEN AND STATICALLY CHECKED AGAINST db/mysql-schema.sql ONLY.
--         NOT executed or verified against a live database (see §9 constraint).
-- Additive / non-breaking: nullable column, existing rows unaffected.
--
-- Rationale: adjudicateDealAppeal() previously hardcoded the post-appeal-approval
-- deal status to 'PROPOSAL_SENT' regardless of the deal's actual stage before it
-- was force-closed (F-08, a correctness bug -- a deal force-closed at
-- CONTRACT_SIGNED was silently demoted to PROPOSAL_SENT on a successful appeal).
-- This column lets forceCloseDeal() snapshot the true prior status so
-- adjudicateDealAppeal() can restore it correctly, and lets a Management
-- checker (plan §7.3(4)) see and confirm the actual target stage instead of a
-- hardcoded one.

ALTER TABLE deal_pipeline
  ADD COLUMN status_before_force_closure VARCHAR(32) NULL AFTER force_closed_reason;
