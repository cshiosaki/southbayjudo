import { NextRequest, NextResponse } from "next/server";
import { matchesHistoricalStudent, readRoster, sheetsConfigured } from "@/lib/sheets";

/**
 * A universal previous-registration lookup, available to every student.
 *
 * Do not allow unauthenticated name-only roster browsing: these records
 * include minors. Require the exact name, date of birth, and email already
 * entered for this registration. Return only the minimally necessary
 * registration data (not guardian contact details or medical information).
 */
export async function POST(req: NextRequest) {
  if (!sheetsConfigured()) {
    return NextResponse.json({ error: "Student lookup is temporarily unavailable." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid lookup request." }, { status: 400 });
  }

  const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
  const lower = (value: string) => value.replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  const firstName = clean(body.firstName);
  const lastName = clean(body.lastName);
  const dateOfBirth = clean(body.dateOfBirth);
  const guardianEmail = clean(body.guardianEmail).toLocaleLowerCase("en-US");

  if (
    firstName.length < 2 || lastName.length < 2 ||
    firstName.length > 100 || lastName.length > 100 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
    guardianEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)
  ) {
    return NextResponse.json({ error: "Enter the student's full name and date of birth, along with your registration email." }, { status: 400 });
  }

  try {
    const rows = await readRoster();
    const matching = rows
      .filter((row) =>
        lower(row.firstName) === lower(firstName) &&
        lower(row.lastName) === lower(lastName) &&
        row.dateOfBirth.trim() === dateOfBirth &&
        [row.guardianEmail, row.guardian2Email].some(
          (email) => email.trim().toLocaleLowerCase("en-US") === guardianEmail
        )
      )
      .sort((a, b) => b.rowNumber - a.rowNumber);

    // A completed paid online registration proves prior attendance. An
    // uncompleted checkout by itself does NOT. For older South Bay Judo
    // students, verify the same name, DOB and guardian email against the
    // historical master roster; that allows the lookup to work even if
    // their most recent online checkout is still pending.
    const latestPaid = matching.find((row) => row.paid);
    const verifiedHistorical = latestPaid
      ? false
      : await matchesHistoricalStudent(firstName, lastName, dateOfBirth, guardianEmail);

    if (!latestPaid && !verifiedHistorical) {
      return NextResponse.json({ found: false });
    }

    // Only return non-sensitive student details after all identifiers match.
    // An older pending record may have a newer rank than a paid older row.
    const newest = matching[0];
    return NextResponse.json({
      found: true,
      student: { beltRank: newest?.beltRank || latestPaid?.beltRank || "" },
    });
  } catch {
    return NextResponse.json({ error: "Student lookup is temporarily unavailable." }, { status: 503 });
  }
}
