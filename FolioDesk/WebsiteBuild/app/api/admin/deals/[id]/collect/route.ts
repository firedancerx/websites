import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireAdmin, getBaseUrl } from "../../../../../../lib/auth";
import { submitDealCollection } from "../../../../../../lib/funnel";
import { saveUpload, validateUpload } from "../../../../../../lib/storage";
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
  const dealId = Number(id);

  const f = await req.formData();
  const invoiceNumber = String(f.get("invoiceNumber") || "").trim();
  const invoiceTotalMyr = parseFloat(String(f.get("invoiceTotalMyr") || "0"));
  const collectedAmountMyr = parseFloat(String(f.get("collectedAmountMyr") || "0"));
  const bankReceiptRef = String(f.get("bankReceiptRef") || "").trim();
  const collectionDate = String(f.get("collectionDate") || new Date().toISOString().slice(0, 10));
  const isFinalCollection = f.get("isFinalCollection") === "1";
  const notes = String(f.get("notes") || "").trim();

  const proofFile = f.get("proofFile") as File | null;

  if (!invoiceNumber || isNaN(invoiceTotalMyr) || isNaN(collectedAmountMyr) || collectedAmountMyr <= 0 || !bankReceiptRef) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals?error=Please+provide+valid+invoice+details,+collection+amount,+and+bank+reference`, getBaseUrl(req)),
      303
    );
  }

  let proofMediaPath: string | null = null;
  if (proofFile && proofFile.size > 0) {
    const ext = validateUpload(proofFile);
    const fileName = `proof_${Date.now()}_${randomBytes(4).toString("hex")}.${ext}`;
    const fileBuffer = Buffer.from(await proofFile.arrayBuffer());
    proofMediaPath = await saveUpload(["proofs", fileName], fileBuffer, proofFile.type);
  }

  try {
    await submitDealCollection({
      dealId,
      invoiceNumber,
      invoiceTotalMyr,
      collectedAmountMyr,
      bankReceiptRef,
      proofMediaPath,
      collectionDate,
      isFinalCollection,
      notes,
    });

    return NextResponse.redirect(
      new URL(
        `/foliodesk/admin/collections?success=Payment+collection+of+RM+${collectedAmountMyr.toFixed(2)}+submitted+and+rates+locked.+Awaiting+management+approval+acknowledgement.`,
        getBaseUrl(req)
      ),
      303
    );
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/foliodesk/admin/deals?error=${encodeURIComponent(errorMessage(err, "Failed to record collection"))}`, getBaseUrl(req)),
      303
    );
  }
}
