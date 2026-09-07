import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { appendRegistrations, sheetsConfigured, type StoredRegistrationOrder } from "@/lib/sheets";
import { getSiteConfig } from "@/lib/config-store";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { DUMMY_SIZES, DUFFLE_SIZES, GI_SIZES, SWEATSHIRT_SIZES, TSHIRT_SIZES } from "@/lib/sessions";

type RawStudent = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function selectedGear(ids: unknown, options: Array<{ id: string; label: string; price: number }>, prefix: string) {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => {
    const item = options.find((option) => option.id === id);
    if (!item) throw new Error(`Invalid ${prefix.toLowerCase()} selection.`);
    return { id: item.id, label: `${prefix} — ${item.label}`, price: item.price };
  });
}

export async function POST(req: NextRequest) {
  if (!sheetsConfigured()) {
    return NextResponse.json({ error: "Google Sheets isn't connected yet — this registration wasn't saved." }, { status: 500 });
  }
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe Checkout isn't connected yet." }, { status: 500 });
  }

  const { guardian, guardian2, students: rawStudents, familyExtras } = await req.json();
  if (!guardian?.firstName || !guardian?.email || !Array.isArray(rawStudents) || rawStudents.length === 0) {
    return NextResponse.json({ error: "Guardian email and at least one student are required." }, { status: 400 });
  }

  try {
    const config = await getSiteConfig();
    const familyPositions: Record<string, number> = {};

    const students = (rawStudents as RawStudent[]).map((student) => {
      const sessionId = text(student.sessionId);
      const classTimeId = text(student.classTimeId);
      const session = config.sessions.find((item) => item.id === sessionId);
      const classTime = config.classTimes.find((item) => item.id === classTimeId);
      if (!session || !classTime) throw new Error("A selected session or class time is no longer available.");

      const firstName = text(student.firstName);
      const lastName = text(student.lastName);
      if (!firstName || !lastName) throw new Error("Every student needs a first and last name.");

      familyPositions[sessionId] = (familyPositions[sessionId] || 0) + 1;
      const position = familyPositions[sessionId];
      const tierPrice =
        session.pricingMode === "flat"
          ? session.flatPrice || 0
          : position === 1
            ? session.familyTierFirst || 0
            : position === 2
              ? session.familyTierSecond || 0
              : session.familyTierThirdPlus || 0;
      const isNewStudent = Boolean(student.isNewStudent);
      const isLateOrTransfer = Boolean(student.isLateOrTransfer);
      const classesRemaining = Math.max(0, Number(student.classesRemaining) || 0);
      const sessionFee = !isNewStudent && isLateOrTransfer ? Math.min(tierPrice, classesRemaining * 10) : tierPrice;
      const gi = student.giSizeId ? GI_SIZES.find((item) => item.id === student.giSizeId) : undefined;
      if (student.giSizeId && !gi) throw new Error("Invalid gi selection.");

      return {
        sessionId,
        sessionLabel: session.label,
        classTimeId,
        classTimeLabel: classTime.label,
        isNewStudent,
        isLateOrTransfer,
        firstName,
        lastName,
        dateOfBirth: text(student.dateOfBirth),
        beltRank: text(student.beltRank),
        emergencyContact: text(student.emergencyContact),
        emergencyPhone: text(student.emergencyPhone),
        hasMedicalConditions: text(student.hasMedicalConditions),
        medicalNotes: text(student.medicalNotes),
        membershipStatus: text(student.membershipStatus) || "none",
        membershipOrg: text(student.membershipOrg),
        memberIdNumber: text(student.memberIdNumber),
        membershipExpires: text(student.membershipExpires),
        photoConsent: text(student.photoConsent),
        signedByName: text(student.signedByName),
        autoRenew: Boolean(student.autoRenew),
        sessionFee,
        gi,
      };
    });

    const gearItems = [
      ...selectedGear(familyExtras?.dummyOrderIds, DUMMY_SIZES, "Practice Dummy"),
      ...selectedGear(familyExtras?.duffleOrderIds, DUFFLE_SIZES, "Duffle Bag"),
      ...selectedGear(familyExtras?.tshirtOrderIds, TSHIRT_SIZES, "T-Shirt"),
      ...selectedGear(familyExtras?.sweatshirtOrderIds, SWEATSHIRT_SIZES, "Sweatshirt"),
    ];

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
    const receipt: StoredRegistrationOrder["receipt"] = {
      receiptNumber,
      registeredAt,
      paymentStatus: "Payment pending",
      students: students.map((student) => ({
        name: `${student.firstName} ${student.lastName}`,
        session: student.sessionLabel,
        classTime: student.classTimeLabel,
        sessionFee: student.sessionFee,
        giLabel: student.gi?.label,
        giPrice: student.gi?.price || 0,
        membershipStatus: student.membershipStatus,
      })),
      gearItems: gearItems.map(({ label, price }) => ({ label, price })),
      total:
        students.reduce((sum, student) => sum + student.sessionFee + (student.gi?.price || 0), 0) +
        gearItems.reduce((sum, item) => sum + item.price, 0),
    };

    if (receipt.total <= 0) throw new Error("The registration total must be greater than zero.");

    const recipients = [text(guardian.email), text(guardian2?.email)]
      .filter((email) => email.includes("@"))
      .filter((email, index, list) => list.indexOf(email) === index);
    const storedOrder: StoredRegistrationOrder = {
      guardianName: `${text(guardian.firstName)} ${text(guardian.lastName)}`.trim(),
      recipients,
      receipt,
    };

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      ...students.flatMap((student) => [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${student.sessionLabel} — ${student.firstName} ${student.lastName}` },
            unit_amount: Math.round(student.sessionFee * 100),
          },
          quantity: 1,
        },
        ...(student.gi
          ? [{
              price_data: {
                currency: "usd",
                product_data: { name: `Gi — ${student.gi.label} — ${student.firstName} ${student.lastName}` },
                unit_amount: Math.round(student.gi.price * 100),
              },
              quantity: 1,
            }]
          : []),
      ]),
      ...gearItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.label },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: 1,
      })),
    ];

    const origin = new URL(req.url).origin;
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: recipients[0],
      client_reference_id: receiptNumber,
      metadata: { receiptNumber },
      payment_intent_data: { metadata: { receiptNumber } },
      payment_method_types: ["card", "us_bank_account"],
      line_items: lineItems,
      success_url: `${origin}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/register?payment=cancelled`,
    });
    if (!checkout.url) throw new Error("Stripe did not return a checkout URL.");

    const extrasNote = [
      ...gearItems.map((item) => `${item.label} — $${item.price}`),
      gearItems.length ? `Gear total: $${gearItems.reduce((sum, item) => sum + item.price, 0)}` : "",
    ].filter(Boolean).join(" · ");

    const rows = students.map((student, index) => [
      new Date().toISOString(), student.sessionId, student.sessionLabel, student.classTimeLabel,
      student.isNewStudent ? "TRUE" : "FALSE", student.isLateOrTransfer ? "TRUE" : "FALSE",
      student.firstName, student.lastName, student.dateOfBirth, student.beltRank,
      text(guardian.firstName), text(guardian.lastName), text(guardian.email), text(guardian.phone),
      text(guardian2?.firstName), text(guardian2?.lastName), text(guardian2?.email), text(guardian2?.phone),
      student.emergencyContact, student.emergencyPhone,
      student.hasMedicalConditions === "no" ? "No" : student.hasMedicalConditions === "yes" ? "Yes" : "",
      student.medicalNotes, student.membershipStatus, student.membershipOrg, student.memberIdNumber,
      student.membershipExpires, student.gi?.label || "", student.photoConsent, student.signedByName,
      student.autoRenew ? "TRUE" : "FALSE", String(student.sessionFee), "FALSE",
      index === 0 ? extrasNote : "", receiptNumber, "Payment pending", checkout.id,
      index === 0 ? JSON.stringify(storedOrder) : "",
    ]);

    try {
      await appendRegistrations(rows);
    } catch (error) {
      await stripe.checkout.sessions.expire(checkout.id).catch(() => undefined);
      throw error;
    }

    return NextResponse.json({ ok: true, checkoutUrl: checkout.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration checkout could not be created.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
