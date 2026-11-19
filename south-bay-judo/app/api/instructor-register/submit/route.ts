import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/config-store";
import { readInstructorRegistration, saveInstructorRegistration, sheetsConfigured } from "@/lib/sheets";
import { verifiedInstructorEmail } from "@/lib/instructor-email-token";

export const dynamic = "force-dynamic";
const validClasses = new Set(["Class 1", "Class 2", "Class 3"]);
const v = (input: unknown) => typeof input === "string" ? input.trim() : "";
const validDate = (input: string) => input === "" || /^\d{4}-\d{2}-\d{2}$/.test(input);
function expiredOrMissing(date: string) {
  if (!date) return true;
  const timestamp = Date.parse(date + "T23:59:59-08:00");
  return !Number.isFinite(timestamp) || timestamp < Date.now();
}
function replyError(error: string, status = 400) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return replyError("Invalid registration request."); }
  const testMode = body.testMode === true;
  if (testMode) {
    if (!process.env.SBJ_TEST_REGISTRATION_PASSWORD ||
        body.testPassword !== process.env.SBJ_TEST_REGISTRATION_PASSWORD) {
      return replyError("Incorrect test registration password.", 401);
    }
  }
  const form = body.form as Record<string, unknown> | undefined;
  if (!form || typeof form !== "object") return replyError("Instructor information is required.");
  const email = v(form.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return replyError("A valid email is required.");
  if (!testMode && verifiedInstructorEmail(body.verificationToken) !== email) {
    return replyError("Please verify your email before registering.", 401);
  }

  const firstName = v(form.firstName), lastName = v(form.lastName),
    phone = v(form.phone), sessionId = v(form.sessionId),
    beltRank = v(form.beltRank), emergencyContact = v(form.emergencyContact),
    emergencyPhone = v(form.emergencyPhone), signedBy = v(form.signedBy),
    medical = v(form.hasMedicalConditions).toLowerCase();
  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100 ||
      !phone || phone.length > 50 || !emergencyContact || !emergencyPhone ||
      !signedBy || signedBy.length > 160 || medical !== "yes" && medical !== "no" ||
      form.waiverAccepted !== true || form.codeOfConductAccepted !== true) {
    return replyError("Complete the required instructor details, emergency contacts, and acknowledgments.");
  }
  const classes = Array.isArray(form.classes) ? form.classes : [];
  if (!classes.length || classes.some((item) => !validClasses.has(item as string)) ||
      new Set(classes).size !== classes.length) {
    return replyError("Select at least one valid class to teach or assist.");
  }

  const dateFields = [
    "usjfExpires", "usaExpires", "usaCoachExpires", "safeSportExpires",
    "cdcExpires", "backgroundExpires", "cprExpires",
  ];
  if (dateFields.some((key) => !validDate(v(form[key])))) {
    return replyError("Check the certification and membership expiration dates.");
  }
  if (v(form.medicalNotes).length > 1000 || v(form.usjfNumber).length > 100 ||
      v(form.usaNumber).length > 100 || v(form.usaCoachCert).length > 100) {
    return replyError("One of the optional fields is too long.");
  }

  let session;
  try {
    const config = await getSiteConfig();
    session = config.sessions.find((item) => item.id === sessionId);
    if (!session) return replyError("Selected session does not exist.");
    if (testMode && sessionId !== "sess_2027_1q") {
      return replyError("Test mode is only available for 1Q Winter 2027.");
    }
    if (!testMode && session.registrationOpen === false) {
      return replyError("Instructor registration has not opened for this session yet.");
    }
    if (!sheetsConfigured()) return replyError("Instructor roster is not configured.", 503);
    // In test mode, still read the sheet to verify the target headers and connection.
    if (testMode) await readInstructorRegistration(email);
  } catch (error) {
    return replyError(error instanceof Error ? error.message : "Session configuration is unavailable.", 503);
  }

  const needs: string[] = [];
  if (!v(form.usjfNumber) || expiredOrMissing(v(form.usjfExpires))) needs.push("USJF membership");
  if (expiredOrMissing(v(form.safeSportExpires))) needs.push("SafeSport");
  if (expiredOrMissing(v(form.cdcExpires))) needs.push("CDC concussion");
  if (expiredOrMissing(v(form.backgroundExpires))) needs.push("Background screening");
  if (expiredOrMissing(v(form.cprExpires))) needs.push("First Aid / CPR / AED");
  const pacificNow = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "short",
    day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date());
  const row = [
    pacificNow, firstName, lastName, email, phone,
    sessionId, (classes as string[]).join(", "), beltRank,
    v(form.usjfNumber), v(form.usjfExpires), v(form.usjfAutoRenew) || "Not sure",
    v(form.usaNumber), v(form.usaExpires), v(form.usaCoachCert), v(form.usaCoachExpires),
    v(form.safeSportExpires), v(form.cdcExpires), v(form.backgroundExpires),
    v(form.cprExpires), emergencyContact, emergencyPhone,
    medical === "yes" ? "Yes" : "No", v(form.medicalNotes),
    "Pending Review", needs.length ? needs.join("; ") : "None",
    signedBy, pacificNow,
  ];

  if (testMode) {
    return NextResponse.json({
      ok: true, testMode: true, session: session.label, classes,
      name: firstName + " " + lastName, status: "Pending Review",
      needsAttention: needs, saved: false,
    }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const result = await saveInstructorRegistration(row);
    return NextResponse.json({
      ok: true, action: result, session: session.label, classes,
      status: "Pending Review", needsAttention: needs,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return replyError("Instructor registration could not be saved. Please contact South Bay Judo.", 503);
  }
}
