import mysql from "mysql2/promise";

async function migrate() {
  const url = process.env.DATABASE_URL || "mysql://root:root@127.0.0.1:3306/foliodesk";
  const conn = await mysql.createConnection(url);
  console.log("Connected to MySQL database...");

  // Check columns on deal_collections
  const [cols] = await conn.execute(`SHOW COLUMNS FROM deal_collections`);
  const colNames = cols.map((c) => c.Field);

  if (!colNames.includes("proof_media_path")) {
    await conn.execute(`ALTER TABLE deal_collections ADD COLUMN proof_media_path VARCHAR(500) NULL AFTER bank_receipt_ref`);
    console.log("✓ Added proof_media_path to deal_collections");
  }
  if (!colNames.includes("locked_direct_rate_pct")) {
    await conn.execute(`ALTER TABLE deal_collections ADD COLUMN locked_direct_rate_pct DECIMAL(5,2) NOT NULL DEFAULT 10.00 AFTER proof_media_path`);
    console.log("✓ Added locked_direct_rate_pct to deal_collections");
  }
  if (!colNames.includes("locked_upline_l1_rate_pct")) {
    await conn.execute(`ALTER TABLE deal_collections ADD COLUMN locked_upline_l1_rate_pct DECIMAL(5,2) NOT NULL DEFAULT 3.00 AFTER locked_direct_rate_pct`);
    console.log("✓ Added locked_upline_l1_rate_pct to deal_collections");
  }
  if (!colNames.includes("locked_upline_l2_rate_pct")) {
    await conn.execute(`ALTER TABLE deal_collections ADD COLUMN locked_upline_l2_rate_pct DECIMAL(5,2) NOT NULL DEFAULT 1.50 AFTER locked_upline_l1_rate_pct`);
    console.log("✓ Added locked_upline_l2_rate_pct to deal_collections");
  }
  if (!colNames.includes("approval_status")) {
    await conn.execute(`ALTER TABLE deal_collections ADD COLUMN approval_status ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED' AFTER locked_upline_l2_rate_pct`);
    console.log("✓ Added approval_status to deal_collections");
  }
  if (!colNames.includes("approved_by")) {
    await conn.execute(`ALTER TABLE deal_collections ADD COLUMN approved_by BIGINT UNSIGNED NULL AFTER approval_status`);
    console.log("✓ Added approved_by to deal_collections");
  }
  if (!colNames.includes("approved_at")) {
    await conn.execute(`ALTER TABLE deal_collections ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by`);
    console.log("✓ Added approved_at to deal_collections");
  }
  if (!colNames.includes("approval_remarks")) {
    await conn.execute(`ALTER TABLE deal_collections ADD COLUMN approval_remarks TEXT NULL AFTER approved_at`);
    console.log("✓ Added approval_remarks to deal_collections");
  }
  if (!colNames.includes("is_immutable")) {
    await conn.execute(`ALTER TABLE deal_collections ADD COLUMN is_immutable TINYINT(1) NOT NULL DEFAULT 1 AFTER approval_remarks`);
    console.log("✓ Added is_immutable to deal_collections");
  }

  // Check columns on payment_advices
  const [advCols] = await conn.execute(`SHOW COLUMNS FROM payment_advices`);
  const advColNames = advCols.map((c) => c.Field);
  if (!advColNames.includes("is_immutable")) {
    await conn.execute(`ALTER TABLE payment_advices ADD COLUMN is_immutable TINYINT(1) NOT NULL DEFAULT 1 AFTER payout_notes`);
    console.log("✓ Added is_immutable to payment_advices");
  }

  await conn.end();
  console.log("Migration completed successfully.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
