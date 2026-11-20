import { NextResponse } from "next/server";
import { getRegistrationFlyerThumbnail } from "@/lib/registration-flyers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await context.params;
  const thumbnail = await getRegistrationFlyerThumbnail(fileId);
  if (!thumbnail) {
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return new NextResponse(thumbnail.bytes, {
    headers: {
      "Content-Type": thumbnail.contentType,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
