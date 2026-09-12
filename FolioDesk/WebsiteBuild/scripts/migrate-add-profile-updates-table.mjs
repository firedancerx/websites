import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function migrate() {
  console.log("--- MIGRATION: ADD affiliate_profile_updates TABLE ---");

  const envPath = path.join(process.cwd(), '.env.local');
  let dbUrl = 'mysql://root:password@127.0.0.1:3306/foliodesk';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) dbUrl = match[1];
  }

  const conn = await mysql.createConnection(dbUrl);

  const createSql = `
    CREATE TABLE IF NOT EXISTS affiliate_profile_updates (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      application_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      status ENUM('PENDING_APPROVAL','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING_APPROVAL',
      full_name VARCHAR(160) NOT NULL,
      applicant_type ENUM('INDIVIDUAL','COMPANY') NOT NULL,
      legal_name VARCHAR(180) NOT NULL,
      company_number VARCHAR(80) NULL,
      country_code CHAR(2) NOT NULL,
      state VARCHAR(100) NULL,
      town VARCHAR(100) NULL,
      postcode VARCHAR(20) NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'MYR',
      address_line1 VARCHAR(255) NULL,
      address_line2 VARCHAR(255) NULL,
      address_line3 VARCHAR(255) NULL,
      phone VARCHAR(50) NOT NULL,
      website_url VARCHAR(500) NULL,
      social_url VARCHAR(500) NULL,
      market_focus ENUM('SINGAPORE','MALAYSIA','BOTH') NOT NULL,
      audience_description TEXT NOT NULL,
      promotion_method TEXT NOT NULL,
      id_doc_path VARCHAR(500) NULL,
      holding_id_path VARCHAR(500) NULL,
      upline_affiliate_code VARCHAR(32) NULL,
      admin_remarks TEXT NULL,
      reviewed_by_user_id BIGINT UNSIGNED NULL,
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_profile_update_app FOREIGN KEY (application_id) REFERENCES affiliate_applications(id) ON DELETE CASCADE,
      CONSTRAINT fk_profile_update_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_profile_update_status (status),
      INDEX idx_profile_update_app (application_id)
    );
  `;

  await conn.execute(createSql);
  console.log("✓ Table 'affiliate_profile_updates' created successfully or already exists.");

  await conn.end();
  console.log("--- MIGRATION COMPLETED SUCCESSFULLY ---");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
