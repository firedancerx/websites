import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../../lib/auth";
import { approveDealCollection } from "../../../../../../lib/funnel";
import { errorMessage } from "../../../../../../lib/errors";

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
  const approvalRemarks = String(f.get("approvalRemarks") || "Approved and acknowledged by management").trim();

  try {
    const { adviceCount } = await approveDealCollection({
      collectionId,
      approverUserId: admin.id,
      approvalRemarks,
    });

    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/collections?success=Collection+approved+and+acknowledged.+Generated+${adviceCount}+immutable+Payment+Advice+voucher(s)+for+affiliate+and+uplines.`,
        getBaseUrl(req)
      ),
      303
    );
  } catch (err) {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/collections?error=${encodeURIComponent(errorMessage(err, "Failed to approve collection"))}`,
        getBaseUrl(req)
      ),
      303
    );
  }
}
