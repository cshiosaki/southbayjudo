import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, stripeConfigured } from "@/lib/stripe";

type ShopItem = {
  id: string;
  quantity?: number;
};

const FIXED_ITEMS: Record<string, { name: string; price: number }> = {
  gi_0000: { name: "White Judo Gi — Size 0000 — South Bay Judo embroidery included", price: 60 },
  gi_000: { name: "White Judo Gi — Size 000 — South Bay Judo embroidery included", price: 60 },
  gi_00: { name: "White Judo Gi — Size 00 — South Bay Judo embroidery included", price: 60 },
  gi_0: { name: "White Judo Gi — Size 0 — South Bay Judo embroidery included", price: 60 },
  gi_1: { name: "White Judo Gi — Size 1 — South Bay Judo embroidery included", price: 65 },
  gi_2: { name: "White Judo Gi — Size 2 — South Bay Judo embroidery included", price: 65 },
  gi_3: { name: "White Judo Gi — Size 3 — South Bay Judo embroidery included", price: 75 },
  gi_4: { name: "White Judo Gi — Size 4 — South Bay Judo embroidery included", price: 75 },
  gi_5: { name: "White Judo Gi — Size 5 — South Bay Judo embroidery included", price: 85 },
  gi_6: { name: "White Judo Gi — Size 6 — South Bay Judo embroidery included", price: 85 },
  gi_7: { name: "White Judo Gi — Size 7 — South Bay Judo embroidery included", price: 85 },
  dummy_4: { name: "Practice Dummy — 4 ft", price: 50 },
  dummy_5: { name: "Practice Dummy — 5 ft", price: 60 },
  dummy_6: { name: "Practice Dummy — 6 ft", price: 70 },
  duffle_s: { name: "Judo Duffle Bag — Small", price: 65 },
  duffle_l: { name: "Judo Duffle Bag — Large", price: 75 },
  tshirt_ys: { name: "T-Shirt — Youth Small", price: 15 },
  tshirt_ym: { name: "T-Shirt — Youth Medium", price: 15 },
  tshirt_yl: { name: "T-Shirt — Youth Large", price: 16 },
  tshirt_as: { name: "T-Shirt — Adult Small", price: 18 },
  tshirt_am: { name: "T-Shirt — Adult Medium", price: 18 },
  tshirt_al: { name: "T-Shirt — Adult Large", price: 19 },
  tshirt_axl: { name: "T-Shirt — Adult XL", price: 20 },
  tshirt_axxl: { name: "T-Shirt — Adult XXL", price: 22 },
  sweat_ys: { name: "Sweatshirt — Youth Small", price: 25 },
  sweat_ym: { name: "Sweatshirt — Youth Medium", price: 25 },
  sweat_yl: { name: "Sweatshirt — Youth Large", price: 26 },
  sweat_as: { name: "Sweatshirt — Adult Small", price: 28 },
  sweat_am: { name: "Sweatshirt — Adult Medium", price: 28 },
  sweat_al: { name: "Sweatshirt — Adult Large", price: 29 },
  sweat_axl: { name: "Sweatshirt — Adult XL", price: 30 },
  sweat_axxl: { name: "Sweatshirt — Adult XXL", price: 32 },
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe Checkout isn't connected yet." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const buyerName = clean(body.buyerName);
    const email = clean(body.email);
    const phone = clean(body.phone);
    const studentName = clean(body.studentName);

    if (!buyerName || !email || !email.includes("@")) {
      return NextResponse.json({ error: "Name and a valid email are required." }, { status: 400 });
    }

    const selectedItems = Array.isArray(body.items) ? (body.items as ShopItem[]) : [];
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const selected of selectedItems) {
      const item = FIXED_ITEMS[clean(selected.id)];
      if (!item) throw new Error("One of the selected merchandise items is invalid.");
      const quantity = Math.max(0, Math.min(20, Math.floor(Number(selected.quantity) || 0)));
      if (!quantity) continue;

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity,
      });
    }

    const customDescription = clean(body.customDescription);
    const customAmount = Number(body.customAmount);
    if (customDescription || customAmount) {
      if (!customDescription) throw new Error("Enter a description for the Other / Special Purchase.");
      if (!Number.isFinite(customAmount) || customAmount < 1 || customAmount > 5000) {
        throw new Error("Other / Special Purchase amount must be between $1 and $5,000.");
      }

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: `Other / Special Purchase — ${customDescription.slice(0, 150)}` },
          unit_amount: Math.round(customAmount * 100),
        },
        quantity: 1,
      });
    }

    if (!lineItems.length) {
      return NextResponse.json({ error: "Add at least one item to your order." }, { status: 400 });
    }

    const orderNumber = `SBJ-GEAR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const origin = new URL(req.url).origin;
    const metadata = {
      orderType: "shop_order",
      orderNumber,
      buyerName: buyerName.slice(0, 100),
      buyerEmail: email.slice(0, 100),
      buyerPhone: phone.slice(0, 100),
      studentName: studentName.slice(0, 100),
    };

    const checkout = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: orderNumber,
      metadata,
      payment_intent_data: { metadata },
      payment_method_types: ["card", "us_bank_account"],
      line_items: lineItems,
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop?payment=cancelled`,
    });

    if (!checkout.url) throw new Error("Stripe did not return a checkout URL.");
    return NextResponse.json({ ok: true, checkoutUrl: checkout.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Order checkout could not be created.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
