import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function sslConfig(): mysql.SslOptions | undefined {
  const mode = (process.env.DATABASE_SSL_MODE || (process.env.NODE_ENV === "production" ? "verify-ca" : "disabled")).toLowerCase();
  if (mode === "disabled") return undefined;

  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
  if (mode === "verify-ca" && !ca) {
    throw new Error("DATABASE_CA_CERT is required when DATABASE_SSL_MODE=verify-ca");
  }

  return {
    ca,
    rejectUnauthorized: mode === "verify-ca",
  };
}

export function db() {
  if (!globalForDb.pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
    globalForDb.pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      ssl: sslConfig(),
      waitForConnections: true,
      connectionLimit: positiveInteger(process.env.DATABASE_POOL_SIZE, 10),
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return globalForDb.pool;
}
