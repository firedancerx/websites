import mysql from "mysql2/promise";
import process from "node:process";

if (!process.env.SOURCE_DATABASE_URL && !process.env.DATABASE_URL) {
  try { process.loadEnvFile(".env.local"); } catch {}
}

const tables = [
  "users",
  "affiliate_applications",
  "application_status_history",
  "deal_pipeline",
  "deal_funnel_steps",
  "deal_collections",
  "payment_advices",
  "payout_batches",
  "onboarded_customers",
  "affiliate_profile_updates",
  "audit_events",
  "sessions",
];

function connectionOptions(prefix, url) {
  const sslMode = (process.env[`${prefix}_DATABASE_SSL_MODE`] || process.env.DATABASE_SSL_MODE || "disabled").toLowerCase();
  const ca = (process.env[`${prefix}_DATABASE_CA_CERT`] || process.env.DATABASE_CA_CERT)?.replace(/\\n/g, "\n");
  if (sslMode === "verify-ca" && !ca) throw new Error(`${prefix}_DATABASE_CA_CERT is required for verify-ca`);
  return { uri: url, ssl: sslMode === "disabled" ? undefined : { ca, rejectUnauthorized: sslMode === "verify-ca" } };
}

async function snapshot(label, url, prefix) {
  const connection = await mysql.createConnection(connectionOptions(prefix, url));
  try {
    const counts = {};
    for (const table of tables) {
      const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
      counts[table] = Number(rows[0].count);
    }

    const [metricRows] = await connection.query(`
      SELECT
        (SELECT COALESCE(SUM(contract_value_myr), 0) FROM deal_pipeline WHERE is_test=0) AS contract_value_myr,
        (SELECT COALESCE(SUM(collected_amount_myr), 0) FROM deal_collections WHERE is_test=0 AND approval_status='APPROVED') AS approved_collections_myr,
        (SELECT COALESCE(SUM(commission_amount_myr), 0) FROM payment_advices WHERE is_test=0) AS commission_total_myr,
        (SELECT COALESCE(SUM(commission_amount_myr), 0) FROM payment_advices WHERE is_test=0 AND payout_status='PAID') AS commission_paid_myr,
        (SELECT COALESCE(SUM(commission_amount_myr), 0) FROM payment_advices WHERE is_test=0 AND payout_status='PENDING_DISBURSEMENT') AS commission_pending_myr,
        (SELECT COALESCE(SUM(total_amount_myr), 0) FROM payout_batches WHERE is_test=0) AS payout_batches_myr
    `);
    const metrics = Object.fromEntries(Object.entries(metricRows[0]).map(([key, value]) => [key, Number(value).toFixed(2)]));

    const [anomalyRows] = await connection.query(`
      SELECT
        (SELECT COUNT(*) FROM payment_advices WHERE payout_status='PAID' AND payout_batch_id IS NULL) AS paid_without_batch,
        (SELECT COUNT(*) FROM (
          SELECT collection_id, beneficiary_affiliate_id, beneficiary_type
          FROM payment_advices
          GROUP BY collection_id, beneficiary_affiliate_id, beneficiary_type
          HAVING COUNT(*) > 1
        ) duplicates) AS duplicate_advice_groups,
        (SELECT COUNT(*) FROM deal_collections c
          WHERE c.approval_status='APPROVED'
          AND NOT EXISTS (SELECT 1 FROM payment_advices p WHERE p.collection_id=c.id)
        ) AS approved_collections_without_advice
    `);
    const anomalies = Object.fromEntries(Object.entries(anomalyRows[0]).map(([key, value]) => [key, Number(value)]));
    return { label, counts, metrics, anomalies };
  } finally {
    await connection.end();
  }
}

function compare(source, target) {
  const differences = [];
  for (const [name, value] of Object.entries(source.counts)) {
    if (target.counts[name] !== value) differences.push({ type: "count", name, source: value, target: target.counts[name] });
  }
  for (const [name, value] of Object.entries(source.metrics)) {
    if (target.metrics[name] !== value) differences.push({ type: "money", name, source: value, target: target.metrics[name] });
  }
  return differences;
}

const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
if (!sourceUrl) throw new Error("SOURCE_DATABASE_URL or DATABASE_URL is required");
const source = await snapshot("source", sourceUrl, "SOURCE");
const targetUrl = process.env.TARGET_DATABASE_URL;
const target = targetUrl ? await snapshot("target", targetUrl, "TARGET") : undefined;
const differences = target ? compare(source, target) : [];
const result = { status: differences.length ? "mismatch" : "ok", source, target, differences };
console.log(JSON.stringify(result, null, 2));
if (differences.length) process.exitCode = 1;
