import { NextRequest, NextResponse } from "next/server";
import { sendUsjfReminderEmail, emailConfigured } from "@/lib/email";

/** Body: { password, guardianEmail, guardianName, studentName, reason, expiresDate? } */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, guardianEmail, guardianName, studentName, reason, expiresDate } = body;

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ error: "Email isn't connected yet — see README." }, { status: 500 });
  }
  if (!guardianEmail) {
    return NextResponse.json({ error: "No guardian email on file for this registration." }, { status: 400 });
  }

  try {
    await sendUsjfReminderEmail({ to: guardianEmail, guardianName, studentName, reason, expiresDate });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to send." }, { status: 500 });
  }
}
