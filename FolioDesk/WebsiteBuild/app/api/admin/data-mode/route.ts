import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../lib/auth";
import { updateAdminDataMode, type DataModeFilter } from "../../../../lib/settings";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const f = await req.formData();
  const mode = String(f.get("mode") || "TEST").toUpperCase() as DataModeFilter;
  const redirectPath = String(f.get("redirectPath") || "/foliodesk/admin").trim();

  if (mode === "TEST" || mode === "ACTUAL" || mode === "ALL") {
    await updateAdminDataMode(mode);
  }

  // F-14 (plan §8 item 10, §4): this route used to also set an
  // admin_data_mode cookie "so state persists immediately on client
  // requests." Nothing in the codebase ever read that cookie -- every admin
  // page re-derives currentDataMode server-side on each request via
  // getAdminDataMode(), which reads system_settings only. The cookie was
  // dead write-only state and a second mechanism the value could drift
  // against (even though nothing was reading it yet); removed so
  // system_settings is the single source of truth, per the plan's call to
  // collapse the two test-mode mechanisms.
  return NextResponse.redirect(new URL(redirectPath, getBaseUrl(req)), 303);
}
