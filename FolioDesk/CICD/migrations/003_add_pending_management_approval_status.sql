-- Migration 003: Add PENDING_MANAGEMENT_APPROVAL to affiliate_applications.status enum
-- Plan reference: §7.4
-- Status: WRITTEN AND STATICALLY CHECKED AGAINST db/mysql-schema.sql ONLY.
--         NOT executed or verified against a live database (see §9 constraint).
-- Additive / non-breaking: existing rows are unaffected; only adds a new enum value.
-- Rationale: the affiliate-facing portal displays affiliate_applications.status directly
-- to the applicant, so a bespoke, visible status is used instead of routing purely
-- through maker_checker_requests.status.

ALTER TABLE affiliate_applications
  MODIFY COLUMN status ENUM(
    'SUBMITTED','UNDER_REVIEW','INFORMATION_REQUIRED','CORRECTION_REQUIRED',
    'PENDING_MANAGEMENT_APPROVAL',
    'APPROVED','REJECTED','SUSPENDED','TERMINATED','RETRACTED','RETRACTION_ACKNOWLEDGED'
  ) NOT NULL DEFAULT 'SUBMITTED';
