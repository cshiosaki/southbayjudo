import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * This endpoint checks only the dedicated dry-run credential. It never
 * reads or changes the production ADMIN_PASSWORD.
 */
export async function POST(req: NextRequest) {
  let supplied = "";
  try {
    const body = await req.json();
    if (typeof body?.password === "string") supplied = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const expected = process.env.SBJ_TEST_REGISTRATION_PASSWORD;
  if (!expected || !supplied || supplied.length > 250) {
    return NextResponse.json({ error: "Incorrect test password." }, { status: 401 });
  }

  const suppliedBytes = Buffer.from(supplied, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  const correct = suppliedBytes.length === expectedBytes.length &&
    timingSafeEqual(suppliedBytes, expectedBytes);
  if (!correct) {
    return NextResponse.json({ error: "Incorrect test password." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
