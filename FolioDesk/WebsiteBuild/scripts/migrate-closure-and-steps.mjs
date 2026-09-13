import mysql from "mysql2/promise";

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const conn = await mysql.createConnection(url);
  console.log("Connected to MySQL database...");

  // 1. Add default_closure_period_days to system_settings
  await conn.execute(`
    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES ('default_closure_period_days', '90', 'Default closure period in days from initial prospect log')
    ON DUPLICATE KEY UPDATE description=VALUES(description);
  `);
  console.log("✓ Added default_closure_period_days to system_settings");

  // 2. Add columns to deal_pipeline
  const [dealCols] = await conn.execute(`SHOW COLUMNS FROM deal_pipeline`);
  const dealColNames = dealCols.map((c) => c.Field);

  if (!dealColNames.includes("extension_days_granted")) {
    await conn.execute(`ALTER TABLE deal_pipeline ADD COLUMN extension_days_granted INT UNSIGNED NOT NULL DEFAULT 0 AFTER contract_value_myr`);
    console.log("✓ Added extension_days_granted to deal_pipeline");
  }
  if (!dealColNames.includes("is_force_closed")) {
    await conn.execute(`ALTER TABLE deal_pipeline ADD COLUMN is_force_closed TINYINT(1) NOT NULL DEFAULT 0 AFTER extension_days_granted`);
    console.log("✓ Added is_force_closed to deal_pipeline");
  }
  if (!dealColNames.includes("force_closed_at")) {
    await conn.execute(`ALTER TABLE deal_pipeline ADD COLUMN force_closed_at TIMESTAMP NULL AFTER is_force_closed`);
    console.log("✓ Added force_closed_at to deal_pipeline");
  }
  if (!dealColNames.includes("force_closed_reason")) {
    await conn.execute(`ALTER TABLE deal_pipeline ADD COLUMN force_closed_reason TEXT NULL AFTER force_closed_at`);
    console.log("✓ Added force_closed_reason to deal_pipeline");
  }
  if (!dealColNames.includes("appeal_status")) {
    await conn.execute(`ALTER TABLE deal_pipeline ADD COLUMN appeal_status ENUM('NONE', 'APPEAL_SUBMITTED', 'APPEAL_APPROVED', 'APPEAL_REJECTED') NOT NULL DEFAULT 'NONE' AFTER force_closed_reason`);
    console.log("✓ Added appeal_status to deal_pipeline");
  }
  if (!dealColNames.includes("appeal_reason")) {
    await conn.execute(`ALTER TABLE deal_pipeline ADD COLUMN appeal_reason TEXT NULL AFTER appeal_status`);
    console.log("✓ Added appeal_reason to deal_pipeline");
  }
  if (!dealColNames.includes("appeal_submitted_at")) {
    await conn.execute(`ALTER TABLE deal_pipeline ADD COLUMN appeal_submitted_at TIMESTAMP NULL AFTER appeal_reason`);
    console.log("✓ Added appeal_submitted_at to deal_pipeline");
  }
  if (!dealColNames.includes("appeal_adjudicated_at")) {
    await conn.execute(`ALTER TABLE deal_pipeline ADD COLUMN appeal_adjudicated_at TIMESTAMP NULL AFTER appeal_submitted_at`);
    console.log("✓ Added appeal_adjudicated_at to deal_pipeline");
  }
  if (!dealColNames.includes("appeal_adjudication_notes")) {
    await conn.execute(`ALTER TABLE deal_pipeline ADD COLUMN appeal_adjudication_notes TEXT NULL AFTER appeal_adjudicated_at`);
    console.log("✓ Added appeal_adjudication_notes to deal_pipeline");
  }

  // 3. Create deal_funnel_steps table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS deal_funnel_steps (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      deal_id BIGINT UNSIGNED NOT NULL,
      from_stage VARCHAR(50) NULL,
      to_stage VARCHAR(50) NOT NULL,
      step_title VARCHAR(180) NOT NULL,
      affiliate_notes TEXT NOT NULL,
      submitted_by_user_id BIGINT UNSIGNED NOT NULL,
      submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      admin_review_status ENUM('PENDING_REVIEW', 'ACKNOWLEDGED', 'RETURNED_FOR_REVIEW') NOT NULL DEFAULT 'PENDING_REVIEW',
      admin_remarks TEXT NULL,
      reviewed_by_user_id BIGINT UNSIGNED NULL,
      reviewed_at TIMESTAMP NULL,
      is_immutable TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_step_deal FOREIGN KEY (deal_id) REFERENCES deal_pipeline(id) ON DELETE CASCADE,
      CONSTRAINT fk_step_submitter FOREIGN KEY (submitted_by_user_id) REFERENCES users(id),
      CONSTRAINT fk_step_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id),
      INDEX idx_step_deal (deal_id),
      INDEX idx_step_status (admin_review_status)
    );
  `);
  console.log("✓ deal_funnel_steps table initialized");

  // 4. Create deal_closure_logs table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS deal_closure_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      deal_id BIGINT UNSIGNED NOT NULL,
      action_type ENUM('FORCED_CLOSURE', 'APPEAL_SUBMITTED', 'EXTENSION_GRANTED', 'APPEAL_REJECTED') NOT NULL,
      days_extended INT NOT NULL DEFAULT 0,
      action_notes TEXT NOT NULL,
      performed_by_user_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_log_deal FOREIGN KEY (deal_id) REFERENCES deal_pipeline(id) ON DELETE CASCADE,
      CONSTRAINT fk_log_user FOREIGN KEY (performed_by_user_id) REFERENCES users(id),
      INDEX idx_closure_log_deal (deal_id)
    );
  `);
  console.log("✓ deal_closure_logs table initialized");

  await conn.end();
  console.log("Migration finished successfully.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
