import Link from "next/link";
import { getStripe, stripeConfigured } from "@/lib/stripe";

function money(cents: number | null) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);
}

export default async function RegistrationSuccessPage({
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
        {paid ? "You're registered" : processing ? "Your registration is saved" : "We couldn't verify the payment"}
      </h1>
      {session ? (
        <>
          <p className="text-ink/70 max-w-lg mx-auto">
            {paid
              ? "South Bay Judo received your registration and payment. Your confirmation receipt is being emailed now."
              : processing
                ? "Your bank payment is processing. We will email your receipt and mark the roster paid as soon as Stripe confirms it."
                : "The checkout was not completed. No paid confirmation has been issued."}
          </p>
          <div className="mt-10 bg-card border border-ink/15 p-6 text-left">
            <div className="flex justify-between gap-4 text-sm border-b border-ink/10 pb-4">
              <span>Registration</span>
              <strong>{session.client_reference_id || "South Bay Judo"}</strong>
            </div>
            <div className="flex justify-between gap-4 pt-4 font-display text-2xl">
              <span>Total</span>
              <span>{money(session.amount_total)}</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-belt max-w-lg mx-auto">The checkout session could not be found. Please contact South Bay Judo before submitting another payment.</p>
      )}
      <Link href="/" className="inline-block mt-8 border border-ink/30 px-5 py-2.5 font-display">Return home</Link>
    </main>
  );
}
