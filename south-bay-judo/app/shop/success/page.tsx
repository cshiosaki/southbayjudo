import Link from "next/link";
import { getStripe, stripeConfigured } from "@/lib/stripe";

function money(cents: number | null) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);
}

export default async function ShopSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;
  const session = stripeConfigured() && sessionId
    ? await getStripe().checkout.sessions.retrieve(sessionId).catch(() => null)
    : null;

  const paid = session?.payment_status === "paid";
  const processing = session?.status === "complete" && !paid;

  return (
    <main className="max-w-2xl mx-auto px-6 py-24 text-center">
      <p className="font-display text-gold text-lg mb-2">
        {paid ? "Payment received" : processing ? "Payment processing" : "Checkout status"}
      </p>
      <h1 className="font-display text-5xl mb-6">
        {paid ? "Your order is in" : processing ? "Your order is submitted" : "We couldn't verify the payment"}
      </h1>

      {session ? (
        <>
          <p className="text-ink/70 max-w-lg mx-auto">
            {paid
              ? "South Bay Judo received your merchandise order and payment."
              : processing
                ? "Your bank payment is processing. Your order will remain attached to this Stripe checkout while payment completes."
                : "The checkout was not completed. No paid order has been confirmed."}
          </p>
          <div className="mt-10 bg-card border border-ink/15 p-6 text-left">
            <div className="flex justify-between gap-4 text-sm border-b border-ink/10 pb-4">
              <span>Order</span>
              <strong>{session.client_reference_id || "South Bay Judo Gear"}</strong>
            </div>
            <div className="flex justify-between gap-4 pt-4 font-display text-2xl">
              <span>Total</span>
              <span>{money(session.amount_total)}</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-belt max-w-lg mx-auto">
          The checkout session could not be found. Please contact South Bay Judo before submitting another payment.
        </p>
      )}

      <div className="mt-8 flex justify-center gap-3 flex-wrap">
        <Link href="/shop" className="border border-ink/30 px-5 py-2.5 font-display">Order more gear</Link>
        <Link href="/" className="bg-ink text-canvas px-5 py-2.5 font-display">Return home</Link>
      </div>
    </main>
  );
}
