import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorMessage } from "@/lib/errors";

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

    const [rows] = await db().execute<DatabaseRow[]>(
      `SELECT id, is_test FROM ${tableName} WHERE id = ? LIMIT 1`,
      [entityId]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
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
  } catch (err) {
    console.error("Failed to toggle test mode:", err);
    return NextResponse.json({ error: errorMessage(err, "Server error") }, { status: 500 });
  }
}
