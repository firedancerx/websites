import { db } from "./db";

export interface CommissionSettings {
  directRatePct: number;
  uplineL1RatePct: number;
  uplineL2RatePct: number;
  closurePeriodDays: number;
}

export async function getCommissionSettings(): Promise<CommissionSettings> {
  const [rows] = await db().execute<DatabaseRow[]>(
    "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('direct_commission_rate_pct', 'upline_l1_commission_rate_pct', 'upline_l2_commission_rate_pct', 'default_closure_period_days')"
  );

  const map = new Map<string, string>();
  rows.forEach((r) => map.set(r.setting_key, r.setting_value));

  return {
    directRatePct: parseFloat(map.get("direct_commission_rate_pct") || "10.00"),
    uplineL1RatePct: parseFloat(map.get("upline_l1_commission_rate_pct") || "3.00"),
    uplineL2RatePct: parseFloat(map.get("upline_l2_commission_rate_pct") || "1.50"),
    closurePeriodDays: parseInt(map.get("default_closure_period_days") || "90", 10),
  };
}

export async function updateCommissionSettings(settings: CommissionSettings): Promise<void> {
  await db().execute(
    "INSERT INTO system_settings (setting_key, setting_value) VALUES ('direct_commission_rate_pct', ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)",
    [settings.directRatePct.toFixed(2)]
  );
  await db().execute(
    "INSERT INTO system_settings (setting_key, setting_value) VALUES ('upline_l1_commission_rate_pct', ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)",
    [settings.uplineL1RatePct.toFixed(2)]
  );
  await db().execute(
    "INSERT INTO system_settings (setting_key, setting_value) VALUES ('upline_l2_commission_rate_pct', ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)",
    [settings.uplineL2RatePct.toFixed(2)]
  );
  await db().execute(
    "INSERT INTO system_settings (setting_key, setting_value) VALUES ('default_closure_period_days', ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)",
    [String(settings.closurePeriodDays || 90)]
  );
}

export type DataModeFilter = "TEST" | "ACTUAL" | "ALL";

export async function getAdminDataMode(): Promise<DataModeFilter> {
  const [rows] = await db().execute<DatabaseRow[]>(
    "SELECT setting_value FROM system_settings WHERE setting_key = 'admin_data_mode' LIMIT 1"
  );
  const val = String(rows[0]?.setting_value || "TEST").toUpperCase();
  if (val === "ACTUAL" || val === "ALL") return val as DataModeFilter;
  return "TEST";
}

export async function updateAdminDataMode(mode: DataModeFilter): Promise<void> {
  await db().execute(
    "INSERT INTO system_settings (setting_key, setting_value, description) VALUES ('admin_data_mode', ?, 'Active data mode filter for admin portal: TEST, ACTUAL, or ALL') ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)",
    [mode]
  );
}
