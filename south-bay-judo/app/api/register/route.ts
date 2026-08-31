import { NextRequest, NextResponse } from "next/server";
import { appendRegistration, sheetsConfigured } from "@/lib/sheets";

/**
 * Body: { guardian: {...}, students: [...], familyExtras: {...} }
 * Appends one row per student. `paid` always starts FALSE — this demo has
 * no real Stripe charge yet, so the admin marks payment received manually
 * from the roster until the real checkout is wired in.
 *
 * familyExtras (family USJF membership plan, gear orders) is folded into
 * a single note on the FIRST student's row — see the comment in
 * lib/sheets.ts for why.
 */
export async function POST(req: NextRequest) {
  if (!sheetsConfigured()) {
    return NextResponse.json(
      { error: "Google Sheets isn't connected yet — this registration wasn't saved. See README." },
      { status: 500 }
    );
  }

  const { guardian, guardian2, students, familyExtras } = await req.json();

  const extrasParts: string[] = [];
  if (familyExtras?.usedFamilyMembershipPlan) {
    extrasParts.push(`Family USJF plan used: $${familyExtras.membershipTotal}`);
  }
  if (familyExtras?.dummyOrders?.length) {
    extrasParts.push(`Dummies: ${familyExtras.dummyOrders.join(", ")}`);
  }
  if (familyExtras?.duffleOrders?.length) {
    extrasParts.push(`Duffle bags: ${familyExtras.duffleOrders.join(", ")}`);
  }
  if (familyExtras?.tshirtOrders?.length) {
    extrasParts.push(`T-shirts: ${familyExtras.tshirtOrders.join(", ")}`);
  }
  if (familyExtras?.sweatshirtOrders?.length) {
    extrasParts.push(`Sweatshirts: ${familyExtras.sweatshirtOrders.join(", ")}`);
  }
  if (familyExtras?.gearTotal) {
    extrasParts.push(`Gear total: $${familyExtras.gearTotal}`);
  }
  const extrasNote = extrasParts.join(" · ");

  try {
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      await appendRegistration([
        new Date().toISOString(),
        s.sessionId,
        s.sessionLabel,
        s.classTimeLabel,
        s.isNewStudent ? "TRUE" : "FALSE",
        s.isLateOrTransfer ? "TRUE" : "FALSE",
        s.firstName,
        s.lastName,
        s.dateOfBirth,
        s.beltRank || "",
        guardian.firstName,
        guardian.lastName,
        guardian.email,
        guardian.phone,
        guardian2?.firstName || "",
        guardian2?.lastName || "",
        guardian2?.email || "",
        guardian2?.phone || "",
        s.emergencyContact,
        s.emergencyPhone,
        s.hasMedicalConditions === "no" ? "No" : s.hasMedicalConditions === "yes" ? "Yes" : "",
        s.medicalNotes || "",
        s.membershipStatus,
        s.membershipOrg || "",
        s.memberIdNumber || "",
        s.membershipExpires || "",
        s.giSize || "",
        s.photoConsent || "",
        s.signedByName,
        s.autoRenew ? "TRUE" : "FALSE",
        String(s.sessionFeeCharged ?? ""),
        "FALSE",
        i === 0 ? extrasNote : "",
      ]);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to save to the roster." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
