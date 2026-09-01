import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../../lib/auth";
import { rejectDealCollection } from "../../../../../../lib/funnel";

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
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/collections?error=${encodeURIComponent(err?.message || "Failed to reject collection")}`,
        getBaseUrl(req)
      ),
      303
    );
  }
}
