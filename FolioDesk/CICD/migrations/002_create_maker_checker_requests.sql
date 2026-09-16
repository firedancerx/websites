-- Migration 002: Create maker_checker_requests table
-- Plan reference: §7.2
-- Status: WRITTEN AND STATICALLY CHECKED AGAINST db/mysql-schema.sql ONLY.
--         NOT executed or verified against a live database (see §9 constraint).
-- Additive / non-breaking: new table, no existing table structure changes.
-- Depends on: 001_add_management_role.sql (logically, not a hard FK dependency)

CREATE TABLE IF NOT EXISTS maker_checker_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_type ENUM(
    'COLLECTION_APPROVAL',
    'PAYOUT_DISBURSEMENT',
    'APPLICATION_APPROVAL',
    'CLOSURE_APPEAL_ADJUDICATION'
  ) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  action_payload JSON NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  submitted_by BIGINT UNSIGNED NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_by BIGINT UNSIGNED NULL,
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
