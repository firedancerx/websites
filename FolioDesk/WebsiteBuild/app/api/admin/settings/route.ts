import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../lib/auth";
import { updateCommissionSettings } from "../../../../lib/settings";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const f = await req.formData();
  const directRatePct = parseFloat(String(f.get("directRatePct") || "10.00"));
  const uplineL1RatePct = parseFloat(String(f.get("uplineL1RatePct") || "3.00"));
  const uplineL2RatePct = parseFloat(String(f.get("uplineL2RatePct") || "1.50"));
  const closurePeriodDays = parseInt(String(f.get("closurePeriodDays") || "90"), 10);

  if (isNaN(directRatePct) || directRatePct < 0 || directRatePct > 100) {
    return NextResponse.redirect(
      new URL("/foliodesk/admin/settings?error=Invalid+direct+affiliate+commission+percentage", getBaseUrl(req)),
      303
    );
  }

  if (isNaN(uplineL1RatePct) || uplineL1RatePct < 0 || uplineL1RatePct > 100) {
    return NextResponse.redirect(
      new URL("/foliodesk/admin/settings?error=Invalid+upline+L1+override+percentage", getBaseUrl(req)),
      303
    );
  }

  if (isNaN(uplineL2RatePct) || uplineL2RatePct < 0 || uplineL2RatePct > 100) {
    return NextResponse.redirect(
      new URL("/foliodesk/admin/settings?error=Invalid+upline+L2+override+percentage", getBaseUrl(req)),
      303
    );
  }

  if (isNaN(closurePeriodDays) || closurePeriodDays < 7 || closurePeriodDays > 365) {
    return NextResponse.redirect(
      new URL("/foliodesk/admin/settings?error=Closure+period+must+be+between+7+and+365+days", getBaseUrl(req)),
      303
    );
  }

  await updateCommissionSettings({
    directRatePct,
    uplineL1RatePct,
    uplineL2RatePct,
    closurePeriodDays,
  });

  return NextResponse.redirect(
    new URL("/foliodesk/admin/settings?success=Commission+and+closure+period+settings+updated+successfully.", getBaseUrl(req)),
    303
  );
}
