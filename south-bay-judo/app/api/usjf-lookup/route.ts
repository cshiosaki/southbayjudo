import { NextRequest, NextResponse } from "next/server";
import { searchMembers, usjfLookupConfigured } from "@/lib/usjf";

/** GET /api/usjf-lookup?q=smith — returns matching members by name, never errors the caller. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";

  if (!usjfLookupConfigured()) {
    return NextResponse.json({ results: [], configured: false });
  }

  try {
    const results = await searchMembers(q);
    return NextResponse.json({ results, configured: true });
  } catch {
    return NextResponse.json({ results: [], configured: true, error: "Lookup failed." });
  }
}
