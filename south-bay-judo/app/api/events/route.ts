import { NextResponse } from "next/server";
import { DEFAULT_EVENT_DOCUMENT, getEventDocument } from "@/lib/events-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ document: (await getEventDocument()) ?? DEFAULT_EVENT_DOCUMENT });
}
