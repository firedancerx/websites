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

  const res = NextResponse.redirect(new URL(redirectPath, getBaseUrl(req)), 303);
  // Also set cookie so state persists immediately on client requests
  res.cookies.set("admin_data_mode", mode, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
