import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
if (!process.env.DATABASE_URL) {
  try { process.loadEnvFile(".env.local"); } catch {}
}
const url=process.env.DATABASE_URL; if(!url) throw new Error("DATABASE_URL is required");
const sslMode=(process.env.DATABASE_SSL_MODE || (process.env.NODE_ENV === "production" ? "verify-ca" : "disabled")).toLowerCase();
const ca=process.env.DATABASE_CA_CERT?.replace(/\\n/g,"\n");
if(sslMode === "verify-ca" && !ca) throw new Error("DATABASE_CA_CERT is required when DATABASE_SSL_MODE=verify-ca");
const schemaSql=await fs.readFile(path.join(process.cwd(),"db/mysql-schema.sql"),"utf8");
const connection=await mysql.createConnection({uri:url,multipleStatements:true,ssl:sslMode === "disabled" ? undefined : {ca,rejectUnauthorized:sslMode === "verify-ca"}});
try {
  await connection.query(schemaSql);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(process.cwd(), "db/migrations");
  const migrationNames = (await fs.readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
  const [appliedRows] = await connection.query("SELECT migration_name FROM schema_migrations");
  const applied = new Set(appliedRows.map((row) => row.migration_name));

  for (const migrationName of migrationNames) {
    if (applied.has(migrationName)) continue;

    if (migrationName === "001-payment-advice-uniqueness.sql") {
      const [indexRows] = await connection.query(
        `SELECT 1 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='payment_advices'
           AND INDEX_NAME='uq_adv_collection_beneficiary_type' LIMIT 1`,
      );
      if (indexRows.length === 0) {
        const [duplicateRows] = await connection.query(
          `SELECT collection_id, beneficiary_affiliate_id, beneficiary_type, COUNT(*) AS duplicate_count
           FROM payment_advices
           GROUP BY collection_id, beneficiary_affiliate_id, beneficiary_type
           HAVING COUNT(*) > 1 LIMIT 10`,
        );
        if (duplicateRows.length > 0) {
          throw new Error(`Migration ${migrationName} blocked: duplicate payment advices must be reconciled first.`);
        }
        const migrationSql = await fs.readFile(path.join(migrationsDir, migrationName), "utf8");
        await connection.query(migrationSql);
      }
    } else {
      const migrationSql = await fs.readFile(path.join(migrationsDir, migrationName), "utf8");
      await connection.query(migrationSql);
    }

    await connection.execute("INSERT INTO schema_migrations (migration_name) VALUES (?)", [migrationName]);
    console.log(`Applied migration ${migrationName}`);
  }

  console.log("FolioDesk MySQL schema and migrations are ready.");
} finally {
  await connection.end();
}
