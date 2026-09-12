import { db } from "../lib/db.ts";

async function migrateAddTestFlag() {
  console.log("=== MIGRATION: ADDING IS_TEST COLUMNS & SETTING DEFAULT TO TEST DATA ===");

  const tables = [
    "affiliate_applications",
    "deal_pipeline",
    "deal_funnel_steps",
    "deal_collections",
    "payment_advices",
    "payout_batches",
  ];

  for (const table of tables) {
    try {
      // Check if column already exists
      const [cols] = await db().execute(`SHOW COLUMNS FROM ${table} LIKE 'is_test'`);
      if (cols.length === 0) {
        console.log(`Adding is_test column to ${table}...`);
        await db().execute(`ALTER TABLE ${table} ADD COLUMN is_test TINYINT(1) NOT NULL DEFAULT 1`);
      } else {
        console.log(`is_test column already exists on ${table}.`);
      }

      // Update all existing records to is_test = 1
      const [res] = await db().execute(`UPDATE ${table} SET is_test = 1 WHERE is_test IS NULL OR is_test = 0`);
      console.log(`Updated existing records in ${table} to is_test = 1:`, res.affectedRows || 0);
    } catch (err) {
      console.error(`Error migrating table ${table}:`, err);
    }
  }

  // Ensure default admin_data_mode setting exists in system_settings
  try {
    await db().execute(`
      INSERT INTO system_settings (setting_key, setting_value, description)
      VALUES ('admin_data_mode', 'TEST', 'Active data mode filter for admin portal: TEST, ACTUAL, or ALL')
      ON DUPLICATE KEY UPDATE setting_value = COALESCE(setting_value, 'TEST')
    `);
    console.log("✅ Configured default admin_data_mode = 'TEST' in system_settings.");
  } catch (err) {
    console.error("Error updating system_settings:", err);
  }

  console.log("=== MIGRATION COMPLETE ===");
  process.exit(0);
}

migrateAddTestFlag().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
