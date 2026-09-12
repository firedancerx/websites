import { db } from "./db";

export interface PackageItem {
  id: number;
  package_name: string;
  package_code: string;
  unit_price_myr: number;
  billing_cycle: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getActivePackages(): Promise<PackageItem[]> {
  const [rows] = await db().execute<any[]>(
    "SELECT * FROM packages WHERE is_active = 1 ORDER BY unit_price_myr ASC, id ASC"
  );
  return rows.map((r) => ({
    id: r.id,
    package_name: r.package_name,
    package_code: r.package_code,
    unit_price_myr: Number(r.unit_price_myr),
    billing_cycle: r.billing_cycle,
    is_active: Boolean(r.is_active),
  }));
}

export async function getAllPackages(): Promise<PackageItem[]> {
  const [rows] = await db().execute<any[]>(
    "SELECT * FROM packages ORDER BY is_active DESC, id ASC"
  );
  return rows.map((r) => ({
    id: r.id,
    package_name: r.package_name,
    package_code: r.package_code,
    unit_price_myr: Number(r.unit_price_myr),
    billing_cycle: r.billing_cycle,
    is_active: Boolean(r.is_active),
  }));
}

export async function upsertPackage(data: {
  id?: number;
  packageName: string;
  packageCode: string;
  unitPriceMyr: number;
  billingCycle?: string;
  isActive?: boolean;
}): Promise<void> {
  const billingCycle = data.billingCycle || "per annum";
  const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;

  if (data.id) {
    await db().execute(
      `UPDATE packages 
       SET package_name=?, package_code=?, unit_price_myr=?, billing_cycle=?, is_active=?
       WHERE id=?`,
      [data.packageName, data.packageCode, data.unitPriceMyr, billingCycle, isActive, data.id]
    );
  } else {
    await db().execute(
      `INSERT INTO packages (package_name, package_code, unit_price_myr, billing_cycle, is_active)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         unit_price_myr=VALUES(unit_price_myr), 
         billing_cycle=VALUES(billing_cycle), 
         is_active=VALUES(is_active)`,
      [data.packageName, data.packageCode, data.unitPriceMyr, billingCycle, isActive]
    );
  }
}
