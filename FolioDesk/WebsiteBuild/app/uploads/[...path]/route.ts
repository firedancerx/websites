import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { currentUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { readUpload } from "../../../lib/storage";

interface AllowedUploadRow extends RowDataPacket {
  allowed: number;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const publicPath = `/foliodesk/uploads/${pathSegments.join("/")}`;
    if (user.role !== "ADMIN") {
      const [allowedRows] = await db().execute<AllowedUploadRow[]>(
        `(SELECT 1 AS allowed FROM affiliate_applications
          WHERE user_id=? AND (id_doc_path=? OR holding_id_path=?))
         UNION ALL
         (SELECT 1 AS allowed FROM affiliate_profile_updates
          WHERE user_id=? AND (id_doc_path=? OR holding_id_path=?))
         UNION ALL
         (SELECT 1 AS allowed
          FROM deal_collections dc
          JOIN deal_pipeline dp ON dp.id=dc.deal_id
          JOIN affiliate_applications aa ON aa.id=dp.affiliate_id
          WHERE aa.user_id=? AND dc.proof_media_path=?)
         LIMIT 1`,
        [user.id, publicPath, publicPath, user.id, publicPath, publicPath, user.id, publicPath],
      );
      if (allowedRows.length === 0) return new NextResponse("Forbidden", { status: 403 });
    }

    const file = await readUpload(pathSegments);

    const body = new Blob([file.bytes as Uint8Array<ArrayBuffer>], { type: file.contentType });
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": file.contentLength.toString(),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
