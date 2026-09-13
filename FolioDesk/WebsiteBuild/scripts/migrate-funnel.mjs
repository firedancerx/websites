import mysql from "mysql2/promise";

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const conn = await mysql.createConnection(url);
  console.log("Connected to MySQL database...");

  // 1. System Settings Table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(80) PRIMARY KEY,
      setting_value VARCHAR(255) NOT NULL,
      description VARCHAR(255) NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // Seed default commission rates
  await conn.execute(`
    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES 
      ('direct_commission_rate_pct', '10.00', 'Direct selling affiliate commission percentage'),
      ('upline_l1_commission_rate_pct', '3.00', 'Upline Level 1 override commission percentage'),
      ('upline_l2_commission_rate_pct', '1.50', 'Upline Level 2 override commission percentage')
    ON DUPLICATE KEY UPDATE description=VALUES(description);
  `);
  console.log("✓ system_settings table initialized with default rates (Direct: 10%, L1: 3%, L2: 1.5%)");

  // 2. Deal Pipeline (Sales Funnel) Table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS deal_pipeline (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      affiliate_id BIGINT UNSIGNED NOT NULL,
      deal_code VARCHAR(32) NOT NULL UNIQUE,
      customer_name VARCHAR(180) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NULL,
      package_name VARCHAR(150) NOT NULL,
      package_count INT UNSIGNED NOT NULL DEFAULT 1,
      contract_value_myr DECIMAL(12,2) NOT NULL DEFAULT 60000.00,
      status ENUM(
        'LEAD_SUBMITTED',
        'QUALIFIED',
        'PROPOSAL_SENT',
        'SUSPENDED_EFFORT',
        'ABORTED',
        'CONTRACT_SIGNED',
        'INVOICED',
        'PARTIAL_COLLECTED',
        'FULLY_COLLECTED',
        'UNCOLLECTIBLE'
      ) NOT NULL DEFAULT 'LEAD_SUBMITTED',
      status_note TEXT NULL,
      suspended_reason TEXT NULL,
      aborted_reason TEXT NULL,
      signed_date DATE NULL,
      invoice_number VARCHAR(64) NULL,
      invoiced_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_deal_affiliate FOREIGN KEY (affiliate_id) REFERENCES affiliate_applications(id) ON DELETE CASCADE,
      INDEX idx_deal_status (status),
      INDEX idx_deal_affiliate (affiliate_id)
    );
  `);
  console.log("✓ deal_pipeline table initialized");

  // 3. Deal Collections Table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS deal_collections (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      deal_id BIGINT UNSIGNED NOT NULL,
      invoice_number VARCHAR(64) NOT NULL,
      invoice_total_myr DECIMAL(12,2) NOT NULL,
      collected_amount_myr DECIMAL(12,2) NOT NULL,
      bank_receipt_ref VARCHAR(100) NOT NULL,
      collection_date DATE NOT NULL,
      is_final_collection TINYINT(1) NOT NULL DEFAULT 0,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_coll_deal FOREIGN KEY (deal_id) REFERENCES deal_pipeline(id) ON DELETE CASCADE,
      INDEX idx_coll_deal (deal_id)
    );
  `);
  console.log("✓ deal_collections table initialized");

  // 4. Payment Advices Table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS payment_advices (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      advice_number VARCHAR(32) NOT NULL UNIQUE,
      collection_id BIGINT UNSIGNED NOT NULL,
      deal_id BIGINT UNSIGNED NOT NULL,
      beneficiary_affiliate_id BIGINT UNSIGNED NOT NULL,
      beneficiary_type ENUM('DIRECT_AFFILIATE', 'UPLINE_L1', 'UPLINE_L2') NOT NULL,
      rate_percentage DECIMAL(5,2) NOT NULL,
      collection_amount_base_myr DECIMAL(12,2) NOT NULL,
      commission_amount_myr DECIMAL(12,2) NOT NULL,
      payout_status ENUM('PENDING_DISBURSEMENT', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING_DISBURSEMENT',
      paid_at TIMESTAMP NULL,
      manual_bank_tx_ref VARCHAR(100) NULL,
      payout_notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_adv_collection FOREIGN KEY (collection_id) REFERENCES deal_collections(id) ON DELETE CASCADE,
      CONSTRAINT fk_adv_deal FOREIGN KEY (deal_id) REFERENCES deal_pipeline(id) ON DELETE CASCADE,
      CONSTRAINT fk_adv_affiliate FOREIGN KEY (beneficiary_affiliate_id) REFERENCES affiliate_applications(id) ON DELETE CASCADE,
      INDEX idx_adv_beneficiary (beneficiary_affiliate_id),
      INDEX idx_adv_status (payout_status)
    );
  `);
  console.log("✓ payment_advices table initialized");

  // Migrate existing onboarded_customers into deal_pipeline if not yet migrated
  const [existingCustomers] = await conn.execute(`SELECT * FROM onboarded_customers`);
  for (const c of existingCustomers) {
    const dealCode = `DEAL-2026-${String(c.id).padStart(4, "0")}`;
    await conn.execute(`
      INSERT INTO deal_pipeline 
        (affiliate_id, deal_code, customer_name, customer_email, customer_phone, package_name, package_count, contract_value_myr, status, signed_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONTRACT_SIGNED', ?, ?)
      ON DUPLICATE KEY UPDATE customer_name=VALUES(customer_name);
    `, [
      c.affiliate_id,
      dealCode,
      c.customer_name,
      c.customer_email,
      c.customer_phone,
      c.package_name,
      c.package_count || 1,
      c.annual_value_myr || 60000.00,
      c.signed_date,
      c.created_at,
    ]);
  }
  console.log(`✓ Synchronized ${existingCustomers.length} existing customer contracts into sales pipeline deals`);

  await conn.end();
  console.log("Migration finished successfully.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
