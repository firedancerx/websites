import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { upsertPackage } from "../../../../lib/packages";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const formData = await req.formData();
    const id = formData.get("id") ? Number(formData.get("id")) : undefined;
    const packageName = String(formData.get("packageName") || "").trim();
    const packageCode = String(formData.get("packageCode") || "").trim().toUpperCase();
    const unitPriceMyr = Number(formData.get("unitPriceMyr") || 0);
    const billingCycle = String(formData.get("billingCycle") || "per annum").trim();
    const isActive = formData.get("isActive") === "1" || formData.get("isActive") === "on" || formData.get("isActive") === "true";

    if (!packageName || !packageCode || unitPriceMyr <= 0) {
      return NextResponse.redirect(
        new URL("/admin/settings?error=" + encodeURIComponent("Package Name, Code, and Unit Price must be valid."), req.url)
      );
    }

    await upsertPackage({
      id,
      packageName,
      packageCode,
      unitPriceMyr,
      billingCycle,
      isActive,
    });

    return NextResponse.redirect(
      new URL("/admin/settings?success=" + encodeURIComponent(`Package "${packageName}" updated successfully.`), req.url)
    );
  } catch (err: any) {
    console.error("Error saving package:", err);
    return NextResponse.redirect(
      new URL("/admin/settings?error=" + encodeURIComponent(err.message || "Failed to save package."), req.url)
    );
  }
}
