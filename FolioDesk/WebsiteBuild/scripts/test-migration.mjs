import mysql from "mysql2/promise";
import process from "node:process";

if (!process.env.DATABASE_URL) {
  try { process.loadEnvFile(".env.local"); } catch {}
}

const sourceUrl = new URL(process.env.TEST_DATABASE_ADMIN_URL || process.env.DATABASE_URL || "");
if (!sourceUrl.href || !["127.0.0.1", "localhost"].includes(sourceUrl.hostname)) {
  throw new Error("Migration rehearsal is restricted to a local MySQL server");
}

const databaseName = `foliodesk_migration_test_${process.pid}`;
if (!/^foliodesk_migration_test_\d+$/.test(databaseName)) throw new Error("Unsafe temporary database name");

const adminUrl = new URL(sourceUrl);
adminUrl.pathname = "/";
const testUrl = new URL(sourceUrl);
testUrl.pathname = `/${databaseName}`;

const admin = await mysql.createConnection(adminUrl.toString());
try {
  await admin.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  process.env.DATABASE_URL = testUrl.toString();
  process.env.DATABASE_SSL_MODE = "disabled";
  await import(`./migrate.mjs?test=${Date.now()}`);

  const testConnection = await mysql.createConnection(testUrl.toString());
  try {
    const [tableRows] = await testConnection.query(
      "SELECT COUNT(*) AS table_count FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()",
    );
    const [indexRows] = await testConnection.query(
      `SELECT COUNT(*) AS index_count FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='payment_advices'
         AND INDEX_NAME='uq_adv_collection_beneficiary_type'`,
    );
    const tableCount = Number(tableRows[0].table_count);
    const indexCount = Number(indexRows[0].index_count);
    if (tableCount < 18 || indexCount !== 3) {
      throw new Error(`Fresh migration verification failed (tables=${tableCount}, unique-index-columns=${indexCount})`);
    }
    console.log(JSON.stringify({ status: "ok", tableCount, uniqueIndexColumns: indexCount }, null, 2));
  } finally {
    await testConnection.end();
  }
} finally {
  await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
  await admin.end();
}
