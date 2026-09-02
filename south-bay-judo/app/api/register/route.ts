import { NextRequest, NextResponse } from "next/server";
import { appendRegistration, sheetsConfigured } from "@/lib/sheets";
import {
  emailConfigured,
  sendRegistrationConfirmationEmail,
  type RegistrationReceipt,
  type RegistrationReceiptItem,
} from "@/lib/email";

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

  if (!guardian?.firstName || !guardian?.email || !Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: "Guardian email and at least one student are required." }, { status: 400 });
  }

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

  const registeredAt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date());
  const receiptNumber = `SBJ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  const gearItems: RegistrationReceiptItem[] = Array.isArray(familyExtras?.gearItems)
    ? familyExtras.gearItems
        .filter((item: unknown) => !!item && typeof item === "object")
        .map((item: { label?: unknown; price?: unknown }) => ({
          label: String(item.label || "Gear"),
          price: Number(item.price) || 0,
        }))
    : [];

  const receipt: RegistrationReceipt = {
    receiptNumber,
    registeredAt,
    paymentStatus: "Payment pending",
    students: students.map((student: any) => ({
      name: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
      session: String(student.sessionLabel || ""),
      classTime: String(student.classTimeLabel || ""),
      sessionFee: Number(student.sessionFeeCharged) || 0,
      giLabel: student.giLabel ? String(student.giLabel) : undefined,
      giPrice: Number(student.giPrice) || 0,
      membershipStatus: String(student.membershipStatus || "none"),
    })),
    gearItems,
    total:
      students.reduce(
        (sum: number, student: any) =>
          sum + (Number(student.sessionFeeCharged) || 0) + (Number(student.giPrice) || 0),
        0
      ) + gearItems.reduce((sum, item) => sum + item.price, 0),
  };

  let emailSent = false;
  let emailError = "";
  if (emailConfigured()) {
    const recipients = [guardian.email, guardian2?.email]
      .filter((email): email is string => typeof email === "string" && email.includes("@"))
      .filter((email, index, list) => list.indexOf(email) === index);
    try {
      await sendRegistrationConfirmationEmail({
        to: recipients,
        guardianName: `${guardian.firstName} ${guardian.lastName || ""}`.trim(),
        receipt,
      });
      emailSent = true;
    } catch (error: any) {
      emailError = error?.message || "Confirmation email could not be sent.";
    }
  } else {
    emailError = "Email is not connected yet.";
  }

  return NextResponse.json({ ok: true, receipt, emailSent, emailError });
}
