import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { fullName, email, phone, companyName, region, tier, message } = data;

    // Validate required fields
    if (!fullName || !email || !phone || !companyName || !region || !tier) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    // Insert lead into audit_events as a lightweight way to store it immediately without migrations
    const eventData = {
      fullName,
      email,
      phone,
      companyName,
      region,
      tier,
      message: message || null,
      submittedAt: new Date().toISOString(),
    };

    await db().execute(
      "INSERT INTO audit_events (action, entity_type, entity_id, event_data) VALUES (?, ?, ?, ?)",
      [
        "CUSTOMER_LEAD_SUBMITTED",
        "customer_lead",
        email.substring(0, 80), // Ensure it fits the entity_id schema (VARCHAR 80)
        JSON.stringify(eventData),
      ]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Demo request error:", err);
    return NextResponse.json(
      { error: "Failed to submit demo request. Please try again later." },
      { status: 500 }
    );
  }
}
