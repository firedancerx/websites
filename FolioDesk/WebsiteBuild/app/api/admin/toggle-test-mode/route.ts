import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { entityType, entityId, targetMode } = body;

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "Missing entityType or entityId" }, { status: 400 });
    }

    let tableName = "";
    if (entityType === "affiliate") tableName = "affiliate_applications";
    else if (entityType === "deal") tableName = "deal_pipeline";
    else if (entityType === "collection") tableName = "deal_collections";
    else if (entityType === "payment_advice") tableName = "payment_advices";
    else {
      return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
    }

    const [rows] = await db().execute<any[]>(
      `SELECT id, is_test FROM ${tableName} WHERE id = ? LIMIT 1`,
      [entityId]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    // F-07 (plan §8 item 6, §6.1, "highest-severity UI finding"): this route had
    // no status check at all -- is_test could be flipped on a locked/approved
    // collection or a PAID advice, silently desyncing a sealed financial record
    // from the test/actual reporting split. Gated here at the server, not just
    // the client confirm() dialog, since the client check alone is not a
    // security boundary. Each entity type is checked against its own locked
    // condition, and a deal/affiliate is additionally blocked once ANY
    // financial record beneath it has locked, since flipping the parent would
    // desync the reporting split around records it has no direct field for.
    if (entityType === "collection") {
      const [collRows] = await db().execute<any[]>(
        "SELECT is_immutable FROM deal_collections WHERE id=? LIMIT 1",
        [entityId]
      );
      if (Number(collRows[0]?.is_immutable) === 1) {
        return NextResponse.json(
          { error: "This collection has been approved or rejected and sealed as immutable. Data mode can no longer be changed." },
          { status: 409 }
        );
      }
    } else if (entityType === "payment_advice") {
      const [advRows] = await db().execute<any[]>(
        "SELECT payout_status FROM payment_advices WHERE id=? LIMIT 1",
        [entityId]
      );
      if (advRows[0]?.payout_status === "PAID") {
        return NextResponse.json(
          { error: "This payment advice has already been paid out. Data mode can no longer be changed." },
          { status: 409 }
        );
      }
    } else if (entityType === "deal") {
      const [lockedRows] = await db().execute<any[]>(
        `SELECT
           (SELECT COUNT(*) FROM deal_collections WHERE deal_id=? AND is_immutable=1) AS locked_collections,
           (SELECT COUNT(*) FROM payment_advices WHERE deal_id=? AND payout_status='PAID') AS paid_advices`,
        [entityId, entityId]
      );
      const locked = lockedRows[0];
      if (Number(locked?.locked_collections) > 0 || Number(locked?.paid_advices) > 0) {
        return NextResponse.json(
          { error: "This deal has an approved/rejected collection or a paid advice attached. Data mode can no longer be changed." },
          { status: 409 }
        );
      }
    } else if (entityType === "affiliate") {
      const [lockedRows] = await db().execute<any[]>(
        `SELECT
           (SELECT COUNT(*) FROM deal_collections dc JOIN deal_pipeline dp ON dp.id=dc.deal_id WHERE dp.affiliate_id=? AND dc.is_immutable=1) AS locked_collections,
           (SELECT COUNT(*) FROM payment_advices WHERE beneficiary_affiliate_id=? AND payout_status='PAID') AS paid_advices`,
        [entityId, entityId]
      );
      const locked = lockedRows[0];
      if (Number(locked?.locked_collections) > 0 || Number(locked?.paid_advices) > 0) {
        return NextResponse.json(
          { error: "This affiliate has an approved/rejected collection or a paid advice attached. Data mode can no longer be changed." },
          { status: 409 }
        );
      }
    }

    const currentIsTest = Number(rows[0].is_test || 0);
    const newIsTest = typeof targetMode === "number" ? targetMode : (currentIsTest === 1 ? 0 : 1);

    await db().execute(
      `UPDATE ${tableName} SET is_test = ? WHERE id = ?`,
      [newIsTest, entityId]
    );

    if (entityType === "affiliate") {
      await db().execute(
        `UPDATE onboarded_customers SET is_test = ? WHERE affiliate_id = ?`,
        [newIsTest, entityId]
      );
    }

    await db().execute(
      `INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id, event_data) VALUES (?, 'TOGGLE_TEST_MODE', ?, ?, JSON_OBJECT('from_is_test', ?, 'to_is_test', ?))`,
      [admin.id, entityType, entityId, currentIsTest, newIsTest]
    );

    return NextResponse.json({
      success: true,
      entityType,
      entityId,
      is_test: newIsTest,
      message: `Data mode updated to ${newIsTest === 1 ? "TESTER" : "ACTUAL"}`,
    });
  } catch (err: any) {
    console.error("Failed to toggle test mode:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
