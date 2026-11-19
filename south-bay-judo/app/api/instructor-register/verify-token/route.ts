import { NextRequest, NextResponse } from "next/server";
import { verifiedInstructorEmail } from "@/lib/instructor-email-token";
import { readInstructorRegistration } from "@/lib/sheets";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  let token: unknown;
  try { ({ token } = await req.json()); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const email = verifiedInstructorEmail(token);
  if (!email) {
    return NextResponse.json({ error: "Verification link has expired or is invalid. Request a new one." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const last = await readInstructorRegistration(email);
    return NextResponse.json({
      ok: true, email,
      previous: last ? {
        firstName: last[1] || "", lastName: last[2] || "", phone: last[4] || "",
        beltRank: last[7] || "", usjfNumber: last[8] || "", usjfExpires: last[9] || "",
        usjfAutoRenew: last[10] || "Not sure",
        usaNumber: last[11] || "", usaExpires: last[12] || "",
        usaCoachCert: last[13] || "", usaCoachExpires: last[14] || "",
        safeSportExpires: last[15] || "", cdcExpires: last[16] || "",
        backgroundExpires: last[17] || "", cprExpires: last[18] || "",
        emergencyContact: last[19] || "", emergencyPhone: last[20] || "",
        hasMedicalConditions: last[21] || "", medicalNotes: last[22] || "",
      } : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Instructor records are unavailable." }, { status: 503 });
  }
}
