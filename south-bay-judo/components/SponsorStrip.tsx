import Image from "next/image";
import Link from "next/link";
import { sponsors } from "@/lib/sponsors";

export default function SponsorStrip() {
  const displaySponsors = sponsors.length > 0 ? [...sponsors, ...sponsors] : [];

  return (
    <section className="border-y border-ink/10 bg-card" aria-labelledby="sponsor-heading">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="font-display uppercase tracking-[0.14em] text-belt mb-2">Community support</p>
            <h2 id="sponsor-heading" className="font-display text-3xl sm:text-4xl">
              Thank you to our community sponsors
            </h2>
          </div>
          <Link
            href="/support"
            className="font-display text-lg underline decoration-belt decoration-2 underline-offset-4 hover:text-belt"
          >
            Become a sponsor
          </Link>
        </div>

        {displaySponsors.length > 0 ? (
          <div className="sponsor-marquee overflow-hidden" aria-label="South Bay Judo sponsors">
            <div className="sponsor-track flex items-center gap-12 sm:gap-16 w-max">
              {displaySponsors.map((sponsor, index) => {
                const logo = (
                  <div className="h-20 w-40 sm:h-24 sm:w-48 relative flex-shrink-0">
                    <Image
                      src={sponsor.logo}
                      alt={sponsor.name}
                      fill
                      sizes="192px"
                      className="object-contain"
                    />
                  </div>
                );

                return sponsor.website ? (
                  <a
                    key={`${sponsor.name}-${index}`}
                    href={sponsor.website}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${sponsor.name} website`}
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {logo}
                  </a>
                ) : (
                  <div key={`${sponsor.name}-${index}`} className="opacity-80">
                    {logo}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-ink/20 bg-canvas px-6 py-8 text-center">
            <p className="font-display text-xl mb-2">Sponsor recognition area ready</p>
            <p className="text-sm text-ink/70 max-w-2xl mx-auto">
              Current sponsor logos will appear here as they are added. Each logo can link directly to the sponsor's website.
            </p>
          </div>
        )}

        <p className="mt-7 text-sm text-ink/70 max-w-2xl">
          Interested in supporting South Bay Judo? Help us continue building character, honor, and respect in our community.
        </p>
      </div>
    </section>
  );
}
