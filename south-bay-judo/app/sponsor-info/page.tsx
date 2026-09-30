import Link from "next/link";

const TIERS = ["Platinum", "Gold", "Silver", "Bronze"] as const;

export default function SponsorInfoPage({
  searchParams,
}: {
  searchParams?: { tier?: string; success?: string };
}) {
  const requestedTier = (searchParams?.tier || "").toLowerCase();
  const selectedTier =
    TIERS.find((tier) => tier.toLowerCase() === requestedTier) || "Gold";
  const success = searchParams?.success === "1";

  return (
    <main>
      <section className="bg-ink text-canvas">
        <div className="max-w-4xl mx-auto px-6 py-14 sm:py-16">
          <p className="text-gold font-display text-lg uppercase tracking-[0.12em] mb-3">
            Sponsor information
          </p>
          <h1 className="font-display text-5xl sm:text-6xl leading-none mb-5">
            Complete your sponsor profile
          </h1>
          <p className="text-lg text-canvas/80 max-w-2xl">
            Thank you for supporting South Bay Judo. Please provide your business information and upload your logo so we can recognize your sponsorship on our website.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-14">
        {success ? (
          <div className="bg-card border-t-4 border-gold p-8 mb-10">
            <h2 className="font-display text-3xl mb-3">Thank you!</h2>
            <p className="text-ink/75 leading-relaxed">
              Your sponsor information and logo were received successfully. Your logo will appear in the appropriate sponsor section after the website refreshes.
            </p>
          </div>
        ) : null}

        <form
          action="/api/sponsor-info"
          method="post"
          encType="multipart/form-data"
          className="bg-card border border-ink/10 p-6 sm:p-8 space-y-6"
        >
          <div>
            <label htmlFor="tier" className="block font-display text-lg mb-2">Sponsorship level</label>
            <select id="tier" name="tier" defaultValue={selectedTier} required>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="businessName" className="block font-display text-lg mb-2">Business / organization name</label>
            <input id="businessName" name="businessName" type="text" required />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="contactName" className="block font-display text-lg mb-2">Contact name</label>
              <input id="contactName" name="contactName" type="text" required />
            </div>
            <div>
              <label htmlFor="email" className="block font-display text-lg mb-2">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="phone" className="block font-display text-lg mb-2">Phone <span className="text-ink/50 text-sm">(optional)</span></label>
              <input id="phone" name="phone" type="tel" />
            </div>
            <div>
              <label htmlFor="website" className="block font-display text-lg mb-2">Business website <span className="text-ink/50 text-sm">(optional)</span></label>
              <input id="website" name="website" type="url" placeholder="https://example.com" />
            </div>
          </div>

          <div>
            <label htmlFor="logo" className="block font-display text-lg mb-2">Upload your logo</label>
            <input
              id="logo"
              name="logo"
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              required
            />
            <p className="mt-2 text-sm text-ink/60">
              Accepted formats: PNG, JPG/JPEG, or WebP. For best results, use a high-resolution logo with a transparent background when available.
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="block font-display text-lg mb-2">Notes <span className="text-ink/50 text-sm">(optional)</span></label>
            <textarea id="notes" name="notes" rows={4} />
          </div>

          <button
            type="submit"
            className="bg-belt text-card px-7 py-4 font-display text-xl tracking-wide"
          >
            Submit sponsor information
          </button>
        </form>

        <p className="mt-8 text-sm text-ink/65">
          Questions? Email <a href="mailto:info@southbayjudo.com" className="underline decoration-belt decoration-2 underline-offset-2">info@southbayjudo.com</a>.
        </p>

        <Link href="/support" className="inline-block mt-6 text-sm underline decoration-belt decoration-2 underline-offset-2">
          Back to Support SBJ
        </Link>
      </section>
    </main>
  );
}
