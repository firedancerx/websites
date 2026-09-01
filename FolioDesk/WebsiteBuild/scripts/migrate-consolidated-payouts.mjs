import mysql from "mysql2/promise";

async function migrate() {
  const url = process.env.DATABASE_URL || "mysql://root:root@127.0.0.1:3306/foliodesk";
  const conn = await mysql.createConnection(url);
  console.log("Connected to MySQL database...");

  // 1. Create payout_batches table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS payout_batches (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      batch_code VARCHAR(32) NOT NULL UNIQUE,
      beneficiary_affiliate_id BIGINT UNSIGNED NOT NULL,
      total_amount_myr DECIMAL(12,2) NOT NULL,
      advice_count INT UNSIGNED NOT NULL,
      manual_bank_tx_ref VARCHAR(100) NOT NULL,
      bank_name VARCHAR(100) NULL,
      bank_account_number VARCHAR(100) NULL,
      payout_notes TEXT NULL,
      disbursed_by BIGINT UNSIGNED NOT NULL,
      disbursed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_batch_affiliate FOREIGN KEY (beneficiary_affiliate_id) REFERENCES affiliate_applications(id) ON DELETE CASCADE,
      CONSTRAINT fk_batch_user FOREIGN KEY (disbursed_by) REFERENCES users(id)
    );
  `);
  console.log("✓ payout_batches table initialized");

  // 2. Add payout_batch_id to payment_advices
  const [cols] = await conn.execute(`SHOW COLUMNS FROM payment_advices`);
  const colNames = cols.map((c) => c.Field);
  if (!colNames.includes("payout_batch_id")) {
    await conn.execute(`ALTER TABLE payment_advices ADD COLUMN payout_batch_id BIGINT UNSIGNED NULL AFTER payout_notes`);
    await conn.execute(`ALTER TABLE payment_advices ADD CONSTRAINT fk_adv_batch FOREIGN KEY (payout_batch_id) REFERENCES payout_batches(id) ON DELETE SET NULL`);
    console.log("✓ Added payout_batch_id and foreign key to payment_advices");
  }

  await conn.end();
  console.log("Migration completed successfully.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
