import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../../lib/auth";
import { rejectDealCollection } from "../../../../../../lib/funnel";
import { errorMessage } from "../../../../../../lib/errors";
import { validateCsrfFromForm } from "../../../../../../lib/csrf";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/foliodesk/login", getBaseUrl(req)), 303);
  }

  const { id } = await params;
  const collectionId = Number(id);

  const f = await req.formData();
  const approvalRemarks = String(f.get("approvalRemarks") || "").trim();

  // T-510 (F-15): CSRF synchronizer-token check. Must run before any mutation below.
  if (!(await validateCsrfFromForm(f, admin.session_csrf_hash))) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/collections?error=Your+session+expired.+Please+try+again.`, getBaseUrl(req)),
      303
    );
  }

  if (!approvalRemarks) {
    return NextResponse.redirect(
      new URL("/foliodesk/admin/collections?error=Reason+for+rejecting+collection+is+required", getBaseUrl(req)),
      303
    );
  }

  try {
    await rejectDealCollection({
      collectionId,
      approverUserId: admin.id,
      approvalRemarks,
    });

    return NextResponse.redirect(
      new URL("/foliodesk/admin/collections?success=Collection+has+been+rejected", getBaseUrl(req)),
      303
    );
  } catch (err) {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/collections?error=${encodeURIComponent(errorMessage(err, "Failed to reject collection"))}`,
        getBaseUrl(req)
      ),
      303
    );
  }
}
