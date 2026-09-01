import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };
export function db() {
  if (!globalForDb.pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
    globalForDb.pool = mysql.createPool(process.env.DATABASE_URL);
  }
  return globalForDb.pool;
}
