import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db().query("SELECT 1");
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
