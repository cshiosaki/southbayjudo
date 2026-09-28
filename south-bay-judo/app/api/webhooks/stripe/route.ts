import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendGearOrderConfirmationEmail, sendRegistrationConfirmationEmail } from "@/lib/email";
import { appendPaidGearOrderRowsIfMissing, markRegistrationReceiptEmailSent, updateRegistrationPayment, type GearOrderRow } from "@/lib/sheets";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function parseGearDescription(label: string) {
  const approvedMatch = label.match(/\s+—\s+Approved by:\s*(.+)$/i);
  const approvedBy = approvedMatch?.[1]?.trim() || "";
  const cleaned = approvedMatch ? label.slice(0, approvedMatch.index).trim() : label.trim();

  if (/^Other \/ Special Purchase/i.test(cleaned)) {
    return { item: cleaned, size: "", approvedBy };
  }

  const parts = cleaned.split(" — ").map((part) => part.trim()).filter(Boolean);
  const first = parts[0] || "Merchandise";
  const sizePart = parts.find((part, index) =>
    index > 0 && (/^Size\s+/i.test(part) || /^(Youth|Adult)\b/i.test(part) || /^\d+\s*ft$/i.test(part) || /^(Small|Large)$/i.test(part))
  );

  let item = first;
  if (/^White Judo Gi$/i.test(first) || /^Gi$/i.test(first)) item = "Judo Gi";
  if (/^Judo Duffle Bag$/i.test(first) || /^Duffle Bag$/i.test(first)) item = "Duffle Bag";

  return { item, size: sizePart || "", approvedBy };
}

function aggregateGearRows(rows: GearOrderRow[]) {
  const grouped = new Map<string, GearOrderRow>();
  for (const row of rows) {
    const key = [row.orderNumber, row.studentName, row.item, row.size, row.approvedBy || ""].join("|");
    const current = grouped.get(key);
    if (current) {
      current.quantity += row.quantity;
      current.amount += row.amount;
    } else {
      grouped.set(key, { ...row });
    }
  }
  return Array.from(grouped.values());
}


async function updateFromCheckoutSession(
  session: Stripe.Checkout.Session,
  status: "Payment processing" | "Payment failed" | "Paid",
  paid: boolean
) {
  if (session.metadata?.orderType === "shop_order") {
    if (!paid) return;

    const orderNumber = session.metadata.orderNumber || session.client_reference_id;
    const buyerEmail = session.metadata.buyerEmail || session.customer_details?.email || session.customer_email;
    const buyerName = session.metadata.buyerName || session.customer_details?.name || "Customer";
    if (!orderNumber || !buyerEmail) throw new Error("Shop order is missing order number or buyer email.");

    const lineItems = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 100 });
    const orderDate = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(new Date());

    const gearRows = lineItems.data.map((lineItem) => {
      const parsed = parseGearDescription(lineItem.description || "South Bay Judo merchandise");
      return {
        orderDate,
        buyerName,
        studentName: session.metadata.studentName || "",
        orderNumber,
        item: parsed.item,
        size: parsed.size,
        quantity: lineItem.quantity || 1,
        amount: (lineItem.amount_total || 0) / 100,
        paid: true,
        approvedBy: parsed.approvedBy,
        notes: "Gear Store",
      } satisfies GearOrderRow;
    });
    await appendPaidGearOrderRowsIfMissing(aggregateGearRows(gearRows));

    await sendGearOrderConfirmationEmail({
      to: buyerEmail,
      buyerName,
      orderNumber,
      studentName: session.metadata.studentName || undefined,
      items: lineItems.data.map((item) => ({
        label: item.description || "South Bay Judo merchandise",
        quantity: item.quantity || 1,
        amount: (item.amount_total || 0) / 100,
      })),
      total: (session.amount_total || 0) / 100,
      idempotencyKey: `gear-order-receipt/${orderNumber}`,
    });
    return;
  }

  const receiptNumber = session.metadata?.receiptNumber || session.client_reference_id;
  if (!receiptNumber) throw new Error("Stripe Checkout Session is missing its receipt number.");

  const { order, receiptEmailAlreadySent } = await updateRegistrationPayment(receiptNumber, status, paid);

  if (paid) {
    const familyStudentNames = order.receipt.students.map((student) => student.name).join(", ");
    const gearRows: GearOrderRow[] = [];

    for (const student of order.receipt.students) {
      if (student.giLabel && (student.giPrice || 0) > 0) {
        const parsed = parseGearDescription(`Gi — ${student.giLabel}`);
        gearRows.push({
          orderDate: order.receipt.registeredAt,
          buyerName: order.guardianName,
          studentName: student.name,
          orderNumber: receiptNumber,
          item: parsed.item,
          size: parsed.size,
          quantity: 1,
          amount: student.giPrice || 0,
          paid: true,
          approvedBy: parsed.approvedBy,
          notes: "Registration",
        });
      }
    }

    for (const gearItem of order.receipt.gearItems) {
      const parsed = parseGearDescription(gearItem.label);
      gearRows.push({
        orderDate: order.receipt.registeredAt,
        buyerName: order.guardianName,
        studentName: familyStudentNames,
        orderNumber: receiptNumber,
        item: parsed.item,
        size: parsed.size,
        quantity: 1,
        amount: gearItem.price,
        paid: true,
        approvedBy: parsed.approvedBy,
        notes: "Registration",
      });
    }

    await appendPaidGearOrderRowsIfMissing(aggregateGearRows(gearRows));
  }

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
