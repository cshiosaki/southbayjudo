import { NextRequest } from "next/server";
import { downloadNewsletterPdf } from "@/lib/newsletters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const download = request.nextUrl.searchParams.get("download") === "1";
  const pdf = await downloadNewsletterPdf(params.fileId, download);
  if (!pdf) return new Response("Newsletter not found.", { status: 404 });

  return new Response(pdf.bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": pdf.contentDisposition,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
