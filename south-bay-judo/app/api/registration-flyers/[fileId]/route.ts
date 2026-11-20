import { NextRequest, NextResponse } from "next/server";
import { getRegistrationFlyerPdf } from "@/lib/registration-flyers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await context.params;
  const pdf = await getRegistrationFlyerPdf(fileId, request.nextUrl.searchParams.get("download") === "1");
  if (!pdf) return NextResponse.json({ error: "Flyer unavailable" }, { status: 404 });
  return new NextResponse(new Uint8Array(pdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": pdf.disposition,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
