import Link from "next/link";
import { getSponsors, type SponsorTier } from "@/lib/sponsors";

export const revalidate = 600;

const tiers = [
  {
    name: "Platinum Sponsor",
    amount: "$2,500",
    benefits: [
      "Prominent logo placement on our sponsor banner and website",
      "Business advertising displayed at the judo club",
      "Business promotions shared with our membership",
      "South Bay Judo recognition plaque",
    ],
  },
  {
    name: "Gold Sponsor",
    amount: "$1,000",
    benefits: [
      "Logo placement on our sponsor banner and website",
      "Business advertising displayed at the judo club",
      "Business promotions shared with our membership",
      "South Bay Judo recognition plaque",
    ],
  },
  {
    name: "Silver Sponsor",
    amount: "$500",
    benefits: [
      "Listing on our sponsor banner and website",
      "Business advertising displayed at the judo club",
      "Business promotions shared with our membership",
      "South Bay Judo recognition certificate",
    ],
  },
  {
    name: "Bronze Sponsor",
    amount: "$250",
    benefits: [
      "Business listing on our sponsor banner and website",
      "South Bay Judo recognition certificate",
    ],
  },
];

const tierOrder: SponsorTier[] = ["Platinum", "Gold", "Silver", "Bronze"];

export default async function SupportPage() {
  const sponsors = await getSponsors();

  return (
    <main>
      <section className="bg-ink text-canvas">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <p className="text-gold font-display text-lg uppercase tracking-[0.12em] mb-3">Support South Bay Judo</p>
          <h1 className="font-display text-5xl sm:text-7xl leading-none mb-6">Help us build character, honor, and respect.</h1>
          <p className="text-lg text-canvas/80 max-w-3xl leading-relaxed">
            South Bay Judo is a 501(c)(3) nonprofit organization serving the South Bay community. Sponsorships and donations help us maintain and grow a volunteer-led program focused on discipline, respect, self-confidence, and sportsmanship.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card border-t-4 border-belt p-8">
            <p className="font-display uppercase tracking-[0.14em] text-belt mb-2">Give</p>
            <h2 className="font-display text-4xl mb-4">Make a donation</h2>
            <p className="text-ink/75 leading-relaxed mb-6">
              Contributions of any amount are appreciated and help support the continued operation and growth of South Bay Judo.
            </p>
            <p className="text-sm text-ink/65">
              Online donation checkout can be added here when the payment link is ready.
            </p>
          </div>

          <div className="bg-card border-t-4 border-gold p-8">
            <p className="font-display uppercase tracking-[0.14em] text-belt mb-2">Partner</p>
            <h2 className="font-display text-4xl mb-4">Become a sponsor</h2>
            <p className="text-ink/75 leading-relaxed mb-6">
              Local businesses and community partners can support our mission while receiving recognition throughout the South Bay Judo community.
            </p>
            <a
              href="mailto:info@southbayjudo.com?subject=South%20Bay%20Judo%20Sponsorship"
              className="inline-block bg-belt text-card px-6 py-3 font-display text-lg"
            >
              Ask about sponsorship
            </a>
          </div>
        </div>
      </section>

      <section className="bg-mat/15">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-display text-4xl mb-8">Sponsorship opportunities</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {tiers.map((tier) => (
              <article key={tier.name} className="bg-canvas border border-ink/10 p-7">
                <div className="flex items-baseline justify-between gap-4 mb-5">
                  <h3 className="font-display text-2xl">{tier.name}</h3>
                  <p className="font-display text-2xl text-belt">{tier.amount}</p>
                </div>
                <ul className="space-y-2 text-sm text-ink/75">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
          <div>
            <p className="font-display uppercase tracking-[0.14em] text-belt mb-2">With gratitude</p>
            <h2 className="font-display text-4xl">Our current sponsors</h2>
          </div>
          <Link href="/" className="text-sm underline decoration-belt decoration-2 underline-offset-3">Back to home</Link>
        </div>

        {sponsors.length > 0 ? (
          <div className="space-y-10">
            {tierOrder.map((tier) => {
              const tierSponsors = sponsors.filter((sponsor) => sponsor.tier === tier);
              if (tierSponsors.length === 0) return null;
              return (
                <div key={tier}>
                  <h3 className="font-display text-2xl mb-4">{tier} Sponsors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {tierSponsors.map((sponsor) => (
                      <div
                        key={sponsor.id}
                        className="bg-card border border-ink/10 p-5 min-h-36 flex flex-col items-center justify-center gap-3 text-center"
                      >
                        <div className="h-20 w-full flex items-center justify-center">
                          <img
                            src={sponsor.logo}
                            alt={sponsor.name}
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <span className="font-display text-base">{sponsor.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-dashed border-ink/20 p-10 text-center">
            <p className="font-display text-2xl mb-2">Sponsor logos coming soon</p>
            <p className="text-sm text-ink/70">
              Logos will populate automatically from the Platinum, Gold, Silver, and Bronze Google Drive folders.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
