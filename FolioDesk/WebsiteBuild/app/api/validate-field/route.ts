import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { field, value, applicantType } = body;
    const user = await currentUser();
    const currentUserId = user?.id || null;

    if (!field || typeof value !== "string") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return NextResponse.json({ available: true, empty: true });
    }

    if (field === "email") {
      const email = trimmedValue.toLowerCase();
      const [rows] = await db().execute<DatabaseRow[]>(
        "SELECT u.id, u.status AS user_status, a.status AS app_status FROM users u LEFT JOIN affiliate_applications a ON a.user_id=u.id WHERE u.email=? LIMIT 1",
        [email]
      );

      if (rows.length > 0) {
        const found = rows[0];
        // If it's the current user themselves, it's fine
        if (currentUserId && Number(found.id) === Number(currentUserId)) {
          return NextResponse.json({ available: true, isSelf: true });
        }

        const isRetracted =
          found.app_status === "RETRACTED" || found.app_status === "RETRACTION_ACKNOWLEDGED";

        return NextResponse.json({
          available: false,
          exists: true,
          isRetracted,
          messageEn: isRetracted
            ? "This email belongs to a retracted affiliate account. Please log in to apply for reinstatement."
            : "This email address is already registered. Please log in instead.",
          messageMs: isRetracted
            ? "E-mel ini milik akaun ahli gabungan yang telah menarik diri. Sila log masuk untuk memohon pengembalian semula."
            : "Alamat e-mel ini telah didaftarkan. Sila log masuk sebaliknya.",
        });
      }

      return NextResponse.json({ available: true, exists: false });
    }

    if (field === "company_number") {
      const isCompany = applicantType === "COMPANY";
      const [rows] = await db().execute<DatabaseRow[]>(
        "SELECT id, user_id, status FROM affiliate_applications WHERE company_number=? LIMIT 1",
        [trimmedValue]
      );

      if (rows.length > 0) {
        const found = rows[0];
        // If it's the current user themselves, it's fine
        if (currentUserId && Number(found.user_id) === Number(currentUserId)) {
          return NextResponse.json({ available: true, isSelf: true });
        }

        const isRetracted =
          found.status === "RETRACTED" || found.status === "RETRACTION_ACKNOWLEDGED";

        return NextResponse.json({
          available: false,
          exists: true,
          isRetracted,
          messageEn: isCompany
            ? "This company registration number is already registered in our system."
            : "This personal ID / NRIC / Passport number is already registered in our system.",
          messageMs: isCompany
            ? "Nombor pendaftaran syarikat ini telah didaftarkan dalam sistem kami."
            : "Nombor kad pengenalan / pasport ini telah didaftarkan dalam sistem kami.",
        });
      }

      return NextResponse.json({ available: true, exists: false });
    }

    return NextResponse.json({ error: "Unsupported field" }, { status: 400 });
  } catch (err) {
    console.error("Field validation error:", err);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
