import mysql from "mysql2/promise";
import process from "node:process";

if (!process.env.DATABASE_URL) {
  try { process.loadEnvFile(".env.local"); } catch {}
}

const expected = {
  users: ["id", "email", "password_hash", "role", "status"],
  affiliate_applications: ["id", "user_id", "affiliate_code", "upline_affiliate_code", "is_test"],
  deal_pipeline: ["id", "affiliate_id", "deal_code", "contract_value_myr", "status", "is_test"],
  deal_collections: ["id", "deal_id", "collected_amount_myr", "approval_status", "is_immutable", "is_test"],
  payment_advices: ["id", "collection_id", "beneficiary_affiliate_id", "commission_amount_myr", "payout_status", "payout_batch_id", "is_test"],
  payout_batches: ["id", "beneficiary_affiliate_id", "total_amount_myr", "manual_bank_tx_ref", "is_test"],
  sessions: ["id", "user_id", "token_hash", "expires_at"],
  audit_events: ["id", "actor_user_id", "action", "entity_type", "entity_id"],
};

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const sslMode = (process.env.DATABASE_SSL_MODE || (process.env.NODE_ENV === "production" ? "verify-ca" : "disabled")).toLowerCase();
const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
if (sslMode === "verify-ca" && !ca) throw new Error("DATABASE_CA_CERT is required when DATABASE_SSL_MODE=verify-ca");

const connection = await mysql.createConnection({
  uri: url,
  ssl: sslMode === "disabled" ? undefined : { ca, rejectUnauthorized: sslMode === "verify-ca" },
});

try {
  const [versionRows] = await connection.query("SELECT VERSION() AS version");
  const [columnRows] = await connection.query(
    "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()",
  );
  const available = new Map();
  for (const row of columnRows) {
    const columns = available.get(row.TABLE_NAME) || new Set();
    columns.add(row.COLUMN_NAME);
    available.set(row.TABLE_NAME, columns);
  }

  const failures = [];
  for (const [table, columns] of Object.entries(expected)) {
    if (!available.has(table)) {
      failures.push(`missing table ${table}`);
      continue;
    }
    for (const column of columns) {
      if (!available.get(table).has(column)) failures.push(`missing column ${table}.${column}`);
    }
  }

  if (failures.length) {
    console.error(JSON.stringify({ status: "failed", failures }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ status: "ok", mysqlVersion: versionRows[0].version, verifiedTables: Object.keys(expected) }, null, 2));
  }
} finally {
  await connection.end();
}
