import { NextRequest, NextResponse } from "next/server";
import { issueInstructorToken } from "@/lib/instructor-email-token";
import { sendInstructorVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  let email: unknown;
  try { ({ email } = await req.json()); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const address = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  try {
    const { token, idempotencyKey } = issueInstructorToken(address);
    const link = new URL("/instructor-register", req.url);
    link.hash = "verify=" + token;
    await sendInstructorVerificationEmail({ to: address, link: link.toString(), idempotencyKey });
    return NextResponse.json({ ok: true, message: "Check your inbox for the instructor registration verification link." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to send verification email. Please try again or contact South Bay Judo." }, { status: 503 });
  }
}
