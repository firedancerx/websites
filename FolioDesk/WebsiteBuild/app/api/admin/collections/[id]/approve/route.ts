import { NextResponse } from "next/server";
import { requireAdmin, getBaseUrl } from "../../../../../../lib/auth";
import { db } from "../../../../../../lib/db";
import { validateCsrfFromForm } from "../../../../../../lib/csrf";
import { errorMessage } from "../../../../../../lib/errors";

// T-401 (plan §7.3(1)): this endpoint no longer approves the collection
// directly. It submits a maker_checker_requests row and leaves
// deal_collections.approval_status at PENDING_APPROVAL -- nothing moves
// (no payment advices are generated) until a Management user decides via
// app/api/management/collections/[id]/decide/route.ts. The old direct-write
// behavior (approveDealCollection() called straight from this route) is
// fully decommissioned, per plan §7.7 step 6.

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

  // T-510 (F-15): CSRF synchronizer-token check. Must run before any mutation below.
  if (!(await validateCsrfFromForm(f, admin.session_csrf_hash))) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/collections?error=Your+session+expired.+Please+try+again.`, getBaseUrl(req)),
      303
    );
  }

  try {
    const [collRows] = await db().execute<any[]>(
      "SELECT id, approval_status FROM deal_collections WHERE id=? LIMIT 1",
      [collectionId]
    );
    const coll = collRows[0];
    if (!coll) throw new Error("Collection record not found");
    if (coll.approval_status !== "PENDING_APPROVAL") {
      throw new Error("This collection is not awaiting approval (already decided or does not exist in a pending state).");
    }

    const [existingRows] = await db().execute<any[]>(
      "SELECT id FROM maker_checker_requests WHERE entity_type='deal_collections' AND entity_id=? AND status='PENDING' LIMIT 1",
      [collectionId]
    );
    if (existingRows.length > 0) {
      throw new Error("A Management approval request for this collection is already pending. It cannot be submitted twice.");
    }

    await db().execute(
      `INSERT INTO maker_checker_requests
        (request_type, entity_type, entity_id, action_payload, status, submitted_by)
       VALUES ('COLLECTION_APPROVAL', 'deal_collections', ?, ?, 'PENDING', ?)`,
      [collectionId, JSON.stringify({ collectionId, approvalRemarks }), admin.id]
    );

    await db().execute(
      "INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,event_data) VALUES(?,'COLLECTION_APPROVAL_SUBMITTED','deal_collections',?,JSON_OBJECT('approvalRemarks',?))",
      [admin.id, String(collectionId), approvalRemarks]
    );

    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/collections?success=Submitted+for+Management+approval.+Payment+Advice+vouchers+will+be+generated+only+once+a+Management+user+approves+this+request.`,
        getBaseUrl(req)
      ),
      303
    );
  } catch (err) {
    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/collections?error=${encodeURIComponent(errorMessage(err, "Failed to submit collection for Management approval"))}`,
        getBaseUrl(req)
      ),
      303
    );
  }
}
