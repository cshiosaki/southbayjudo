import { NextRequest, NextResponse } from "next/server";
import { appendGuestRegistration, sheetsConfigured } from "@/lib/sheets";
import { sendGuestRegistrationNotificationEmail } from "@/lib/email";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  if (!sheetsConfigured()) {
    return NextResponse.json({ error: "Google Sheets isn't connected yet." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);
    const homeDojo = clean(body.homeDojo);
    const membershipOrg = clean(body.membershipOrg);
    const membershipId = clean(body.membershipId);
    const emergencyContact = clean(body.emergencyContact);
    const emergencyPhone = clean(body.emergencyPhone);
    const hasMedicalConditions = clean(body.hasMedicalConditions);
    const medicalNotes = clean(body.medicalNotes);
    const isMinor = body.isMinor === true;
    const guardianRelationship = clean(body.guardianRelationship);
    const signedByName = clean(body.signedByName);
    const oneMonthPass = body.oneMonthPass === true;

    if (!firstName || !lastName || !homeDojo || !membershipOrg || !membershipId || !signedByName) {
      return NextResponse.json({ error: "Complete all required guest registration fields." }, { status: 400 });
    }
    if (hasMedicalConditions !== "yes" && hasMedicalConditions !== "no") {
      return NextResponse.json({ error: "Medical condition response is required." }, { status: 400 });
    }
    if (hasMedicalConditions === "yes" && !medicalNotes) {
      return NextResponse.json({ error: "Please provide the medical information." }, { status: 400 });
    }
    if (isMinor && !guardianRelationship) {
      return NextResponse.json({ error: "Guardian relationship is required for minors." }, { status: 400 });
    }

    const checkInDate = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }).format(new Date());

    await appendGuestRegistration({
      checkInDate,
      firstName,
      lastName,
      homeDojo,
      membershipOrg,
      membershipId,
      oneMonthPass,
      emergencyContact,
      emergencyPhone,
      hasMedicalConditions: hasMedicalConditions === "yes" ? "Yes" : "No",
      medicalNotes,
      isMinor,
      guardianRelationship,
      signedByName,
    });

    await sendGuestRegistrationNotificationEmail({
      checkInDate,
      firstName,
      lastName,
      homeDojo,
      membershipOrg,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Guest registration failed", error);
    return NextResponse.json({ error: "Guest registration could not be saved." }, { status: 500 });
  }
}
