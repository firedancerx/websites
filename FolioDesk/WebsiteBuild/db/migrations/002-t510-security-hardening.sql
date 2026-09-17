-- T-510 (F-15): CSRF, rate limiting, password-reset token support.
-- Applied via `pnpm db:migrate` (scripts/migrate.mjs) against an
-- already-provisioned database. Fresh installs get this from
-- db/mysql-schema.sql directly; this file exists for staging/production
-- databases that already exist before this migration ships.

ALTER TABLE sessions
  ADD COLUMN csrf_token_hash CHAR(64) NOT NULL DEFAULT '' AFTER token_hash;

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  route VARCHAR(64) NOT NULL,
  window_start TIMESTAMP NOT NULL,
  attempt_count INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_rate_limit_window (identifier, route, window_start),
  INDEX idx_rate_limit_window_start (window_start)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  requested_ip VARCHAR(64) NULL,
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_reset_expiry (expires_at)
);
