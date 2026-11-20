import Link from "next/link";
import { getCurrentRegistrationFlyers } from "@/lib/registration-flyers";

export const dynamic = "force-dynamic";
import { getSiteConfig } from "@/lib/config-store";


export default async function SchedulePage() {
  const [{ sessions, classTimes }, registrationFlyers] = await Promise.all([getSiteConfig(), getCurrentRegistrationFlyers()]);
  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="font-display text-5xl mb-3">2026–2027 Class Schedule</h1>
      <p className="text-ink/70 max-w-xl mb-12">
        View the remaining 2026 sessions and the complete 2027 class calendar. Regular classes meet
        Tuesdays and Thursdays at the Dee Hardison Sports Center, Wilson Park.
      </p>

      <div className="grid md:grid-cols-3 gap-px bg-ink/10 mb-16">
        {classTimes.map((c) => (
          <div key={c.id} className="bg-card p-6">
            <p className="font-display text-2xl mb-1">{c.label}</p>
            <p className="text-sm text-ink/70 mb-3">{c.age}</p>
            <p className="font-display text-lg text-belt">{c.time}</p>
          </div>
        ))}
      </div>

      <section className="mb-12" aria-labelledby="registration-flyers-heading">
        <h2 id="registration-flyers-heading" className="font-display text-3xl mb-3">Registration Flyers</h2>
        <p className="text-ink/70 mb-5">View or download the latest class registration flyers.</p>
        {registrationFlyers.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {registrationFlyers.map((flyer) => (
              <article key={flyer.id} className="border border-ink/20 bg-card p-6">
                <a
                  href={`/api/registration-flyers/${encodeURIComponent(flyer.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${flyer.title}`}
                  className="mb-5 flex h-72 items-center justify-center overflow-hidden border border-ink/15 bg-white p-3 transition-colors hover:border-belt sm:h-80"
                >
                  <img
                    src={`/api/registration-flyers/${encodeURIComponent(flyer.id)}/thumbnail`}
                    alt={`First page preview of ${flyer.title}`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </a>
                <h3 className="font-display text-xl mb-4">{flyer.title}</h3>
                <div className="flex flex-wrap gap-3">
                  <a href={`/api/registration-flyers/${encodeURIComponent(flyer.id)}`} target="_blank" rel="noopener noreferrer" className="border border-ink/30 px-4 py-2 font-display">
                    View PDF
                  </a>
                  <a href={`/api/registration-flyers/${encodeURIComponent(flyer.id)}?download=1`} className="bg-belt text-card px-4 py-2 font-display">
                    Download PDF
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="border border-ink/20 bg-card p-5 text-ink/70">
            Registration flyers are temporarily unavailable. Please check back soon.
          </p>
        )}
      </section>

      <h2 className="font-display text-3xl mb-6">Sessions &amp; Registration Windows</h2>
      <div className="space-y-10">
        {["2026", "2027"].map((year) => {
          const yearSessions = sessions.filter((session) => session.label.includes(year));
          if (yearSessions.length === 0) return null;
          return (
            <section key={year}>
              <h3 className="mb-3 font-display text-xl text-belt">{year} sessions</h3>
              <div className="space-y-px bg-ink/10">
                {yearSessions.map((s) => (
                  <div key={s.id} className="bg-canvas p-6 grid sm:grid-cols-2 lg:grid-cols-[1.15fr_1.45fr_1.8fr_2.15fr] gap-4 items-start">
                    <p className="font-display text-xl sm:col-span-1">{s.label}</p>
                    <p className="text-sm sm:col-span-1 lg:whitespace-nowrap">
                      {s.dates}
                    </p>
                    <p className="text-sm text-ink/70 sm:col-span-1">{s.regWindow}</p>
                    <p className="text-xs text-ink/55 sm:col-span-1">{s.note}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-10 text-sm text-ink/75">
        <strong>Multiple Family Discount:</strong> $200 first family member, $180 second,
        $160 third and additional family members.
      </p>

      <div className="mt-8">
        <Link href="/register" className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide inline-block">
          Register for a session
        </Link>
      </div>

      <div className="mt-12 pt-8 mat-seam border-ink/15 text-sm text-ink/70 max-w-2xl">
        <p>
          All South Bay Judo members must maintain a yearly membership with the United States Judo Federation (USJF). Registration closes on each session's published deadline; late registration is not offered.
        </p>
      </div>
    </main>
  );
}
