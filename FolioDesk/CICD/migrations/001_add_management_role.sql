-- Migration 001: Add MANAGEMENT role to users.role enum
-- Plan reference: §7.1
-- Status: WRITTEN AND STATICALLY CHECKED AGAINST db/mysql-schema.sql ONLY.
--         NOT executed or verified against a live database (see §9 constraint).
-- Additive / non-breaking: existing rows are unaffected; only adds a new enum value.

ALTER TABLE users
  MODIFY COLUMN role ENUM('APPLICANT','AFFILIATE','ADMIN','MANAGEMENT') NOT NULL DEFAULT 'APPLICANT';
