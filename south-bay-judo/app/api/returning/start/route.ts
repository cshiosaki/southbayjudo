import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { findReturningStudentCandidate } from "@/lib/sheets";
import { createReturningToken } from "@/lib/returning-token";
import { sendReturningStudentLink } from "@/lib/email";

export const dynamic = "force-dynamic";
const RESPONSE = { ok: true, message: "If a matching returning-student record has an email address on file, a verification link has been sent. Check that inbox." };
const noStore = { "Cache-Control": "no-store" };

/** Always respond identically for a missing student to avoid name enumeration. */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = (await req.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: noStore }); }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth.trim() : "";
  const testMode = body.testMode === true;
  if (firstName.length < 2 || firstName.length > 80 ||
      lastName.length < 2 || lastName.length > 80 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return NextResponse.json({ error: "Enter the student's first and last name and valid date of birth." }, { status: 400, headers: noStore });
  }

  try {
    const candidate = await findReturningStudentCandidate(firstName, lastName, dateOfBirth);
    if (!candidate) return NextResponse.json(RESPONSE, { headers: noStore });

    const verified = new Set(candidate.verifiedEmails);
    const preferredRow = candidate.registrationRows.find((r) =>
      verified.has(r.guardianEmail.trim().toLowerCase()) ||
      verified.has(r.guardian2Email.trim().toLowerCase())
    );
    const preferredEmail = preferredRow?.guardianEmail.trim().toLowerCase();
    const alternateEmail = preferredRow?.guardian2Email.trim().toLowerCase();
    const email =
      (preferredEmail && verified.has(preferredEmail) ? preferredEmail : "") ||
      (alternateEmail && verified.has(alternateEmail) ? alternateEmail : "") ||
      candidate.historicalContacts[0]?.email ||
      candidate.verifiedEmails[0];

    if (!email) return NextResponse.json(RESPONSE, { headers: noStore });
    const token = createReturningToken({ firstName, lastName, dateOfBirth, email });
    // An opaque fragment keeps the verification token out of HTTP URLs,
    // referrer headers and normal server access logs.
    const baseUrl = process.env.SBJ_PUBLIC_SITE_URL || "https://www.southbayjudo.com";
    const path = testMode ? "/test-register" : "/register";
    const link = baseUrl.replace(/\/$/, "") + path + "#returning=" + token;

    const key = process.env.SBJ_RETURNING_LOOKUP_KEY || "";
    // Resend idempotency suppresses repeated mail for the same student
    // in each 15-minute bucket without storing login data on the client.
    const interval = Math.floor(Date.now() / (15 * 60_000));
    const idempotencyKey = "sbj-returning-" + createHmac("sha256", key)
      .update(email + "|" + firstName.toLowerCase() + "|" + lastName.toLowerCase() +
        "|" + dateOfBirth + "|" + interval).digest("hex").slice(0, 32);
    await sendReturningStudentLink({ to: email, url: link, idempotencyKey });
    return NextResponse.json(RESPONSE, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Returning-student lookup is temporarily unavailable." }, { status: 503, headers: noStore });
  }
}
