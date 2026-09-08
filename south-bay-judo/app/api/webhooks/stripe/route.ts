import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendRegistrationConfirmationEmail } from "@/lib/email";
import { markRegistrationReceiptEmailSent, updateRegistrationPayment } from "@/lib/sheets";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function updateFromCheckoutSession(
  session: Stripe.Checkout.Session,
  status: "Payment processing" | "Payment failed" | "Paid",
  paid: boolean
) {
  const receiptNumber = session.metadata?.receiptNumber || session.client_reference_id;
  if (!receiptNumber) throw new Error("Stripe Checkout Session is missing its receipt number.");

  const { order, receiptEmailAlreadySent } = await updateRegistrationPayment(receiptNumber, status, paid);
  if (paid && !receiptEmailAlreadySent) {
    await sendRegistrationConfirmationEmail({
      to: order.recipients,
      guardianName: order.guardianName,
      receipt: order.receipt,
      idempotencyKey: `registration-receipt/${receiptNumber}`,
    });
    await markRegistrationReceiptEmailSent(receiptNumber);
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await updateFromCheckoutSession(
        session,
        session.payment_status === "paid" ? "Paid" : "Payment processing",
        session.payment_status === "paid"
      );
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      await updateFromCheckoutSession(event.data.object as Stripe.Checkout.Session, "Paid", true);
    } else if (event.type === "checkout.session.async_payment_failed") {
      await updateFromCheckoutSession(event.data.object as Stripe.Checkout.Session, "Payment failed", false);
    }
  } catch (error) {
    console.error("Stripe fulfillment failed", error);
    return NextResponse.json({ error: "Stripe fulfillment failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
