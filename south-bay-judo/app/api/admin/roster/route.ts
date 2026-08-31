import { NextRequest, NextResponse } from "next/server";
import { readRoster, sheetsConfigured } from "@/lib/sheets";

/** Body: { password: string, sessionId?: string } — omit sessionId for every registration across all sessions. */
export async function POST(req: NextRequest) {
  const { password, sessionId } = await req.json();

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  if (!sheetsConfigured()) {
    return NextResponse.json({ error: "Google Sheets isn't connected yet — see README." }, { status: 500 });
  }

  try {
    const rows = await readRoster(sessionId || undefined);
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to read the roster." }, { status: 500 });
  }
}
