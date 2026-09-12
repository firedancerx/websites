import mysql from "mysql2/promise";

async function migrate() {
  const url = process.env.DATABASE_URL || "mysql://root:root@127.0.0.1:3306/foliodesk";
  const conn = await mysql.createConnection(url);
  console.log("Connected to MySQL database...");

  // 1. Create packages table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS packages (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      package_name VARCHAR(150) NOT NULL UNIQUE,
      package_code VARCHAR(50) NOT NULL UNIQUE,
      unit_price_myr DECIMAL(12,2) NOT NULL,
      billing_cycle VARCHAR(50) NOT NULL DEFAULT 'per annum',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("✓ packages table initialized.");

  // 2. Seed initial packages (Clear old data and insert official 4 products)
  await conn.execute(`DELETE FROM packages;`);
  await conn.execute(`
    INSERT INTO packages (package_name, package_code, unit_price_myr, billing_cycle, is_active)
    VALUES 
      ('FolioDesk 5-User Annual License', 'FD-5USER-ANNUAL', 60000.00, 'per annum', 1),
      ('FolioDesk 3-Year 5-User License', 'FD-3YR-5USER', 158000.00, '3-year term', 1),
      ('Unlimited Master Reseller License', 'FD-MASTER-RESELLER', 1200000.00, 'per annum', 1),
      ('Design Partner Perpetual License', 'FD-DESIGN-PARTNER-LIFETIME', 300000.00, 'perpetual (max 10)', 1);
  `);
  console.log("✓ Seeded official packages: 5-User Annual License (RM60,000/yr), 3-Year 5-User License (RM158,000), Unlimited Master Reseller License (RM1,200,000/yr), Design Partner Perpetual License (RM300,000).");

  await conn.end();
  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
