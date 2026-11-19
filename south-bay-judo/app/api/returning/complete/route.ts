import { NextRequest, NextResponse } from "next/server";
import { readReturningToken } from "@/lib/returning-token";
import { findReturningStudentCandidate, returningPrefillForEmail } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = (await req.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const claims = readReturningToken(body.token);
  if (!claims) {
    return NextResponse.json({ error: "The verification link is invalid or has expired. Request a new link." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    // Re-read records when the link is opened. An encrypted link is only
    // valid if the recipient email is still on the student's verified file.
    const candidate = await findReturningStudentCandidate(
      claims.firstName, claims.lastName, claims.dateOfBirth
    );
    const prefill = candidate && returningPrefillForEmail(candidate, claims.email);
    if (!prefill) {
      return NextResponse.json({ error: "Unable to verify this family. Please register manually or contact South Bay Judo." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ok: true, ...prefill }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Returning-student verification is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
