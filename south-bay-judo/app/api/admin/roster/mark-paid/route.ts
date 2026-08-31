import { NextRequest, NextResponse } from "next/server";
import { setPaid, sheetsConfigured } from "@/lib/sheets";

/** Body: { password: string, rowNumber: number, paid: boolean } */
export async function POST(req: NextRequest) {
  const { password, rowNumber, paid } = await req.json();

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  if (!sheetsConfigured()) {
    return NextResponse.json({ error: "Google Sheets isn't connected yet." }, { status: 500 });
  }

  try {
    await setPaid(rowNumber, paid);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update." }, { status: 500 });
  }
}
