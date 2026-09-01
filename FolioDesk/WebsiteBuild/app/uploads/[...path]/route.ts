import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname } from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Prevent directory traversal
    for (const segment of pathSegments) {
      if (segment === ".." || segment === "." || segment.includes("\\") || segment.includes("/")) {
        return new NextResponse("Invalid Path", { status: 400 });
      }
    }

    const baseUploadsDir = normalize(join(process.cwd(), "public", "uploads"));
    const filePath = normalize(join(baseUploadsDir, ...pathSegments));

    // Security check: ensure path stays within baseUploadsDir
    if (!filePath.startsWith(baseUploadsDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
