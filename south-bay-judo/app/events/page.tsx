import type { Metadata } from "next";
import { getNewsletterFolders } from "@/lib/newsletters";

export const metadata: Metadata = {
  title: "Events & Newsletters | South Bay Judo",
  description: "View South Bay Judo events and read or download current and past newsletters.",
};

export const dynamic = "force-dynamic";

const CALENDAR_URL =
  "https://calendar.google.com/calendar/embed?src=events%40southbayjudo.com&ctz=America%2FLos_Angeles&mode=MONTH&showTitle=0&showPrint=0&showCalendars=0";

export default async function EventsPage() {
  const { current, past } = await getNewsletterFolders();
  const thisYear = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
  }).format(new Date()));
  const newsletterYear = (newsletter: { name: string; title: string }) =>
    Number(newsletter.name.match(/20\d{2}/)?.[0] ?? newsletter.title.match(/20\d{2}/)?.[0] ?? 0);
  const allNewsletters = [...(current ? [current] : []), ...past].filter(
    (newsletter, index, files) => files.findIndex((file) => file.id === newsletter.id) === index
  );
  const currentYearNewsletters = allNewsletters.filter((newsletter) => newsletterYear(newsletter) === thisYear);
  const featuredCurrent = current && newsletterYear(current) === thisYear ? current : null;
  const currentYearPast = currentYearNewsletters.filter((newsletter) => newsletter.id !== featuredCurrent?.id);
  const archives = Object.entries(
    allNewsletters.filter((newsletter) => newsletterYear(newsletter) !== thisYear).reduce<Record<string, typeof allNewsletters>>(
      (groups, newsletter) => {
        const year = newsletterYear(newsletter);
        const key = year ? String(year) : "Other";
        (groups[key] ??= []).push(newsletter);
        return groups;
      },
      {}
    )
  ).sort(([a], [b]) => Number(b) - Number(a));

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 font-display text-sm uppercase tracking-[0.14em] text-belt">What’s happening</p>
          <h1 className="mb-3 font-display text-5xl">Events</h1>
          <p className="max-w-2xl text-ink/70">
            View upcoming South Bay Judo events. Use the calendar controls to move forward or back,
            return to today, or change the calendar view.
          </p>
        </div>
        <a
          href="#newsletters"
          className="self-start border border-ink/30 px-5 py-2.5 font-display text-lg sm:self-auto"
        >
          View newsletters
        </a>
      </div>

      <section aria-label="South Bay Judo Google Calendar">
        <iframe
          src={CALENDAR_URL}
          title="South Bay Judo events calendar"
          className="h-[78vh] min-h-[680px] w-full border border-ink/20 bg-card"
          loading="lazy"
        />
        <p className="mt-3 text-sm text-ink/55">
          Calendar updates are managed through the events@southbayjudo.com Google Calendar.
        </p>
      </section>

      <section id="newsletters" className="mt-14 scroll-mt-8 border-t border-ink/15 pt-10">
        <p className="mb-1 font-display text-sm uppercase tracking-[0.14em] text-belt">Club updates</p>
        <h2 className="mb-3 font-display text-4xl">Newsletters</h2>
        <p className="mb-6 max-w-2xl text-ink/65">
          View newsletters from this year below, or expand an older year to browse previous issues.
        </p>

        {featuredCurrent ? (
          <article className="overflow-hidden border border-ink/20 bg-card">
            <div className="flex flex-col gap-4 border-b border-ink/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-2xl">{featuredCurrent.title}</h3>
                <p className="text-ink/65">Current newsletter</p>
              </div>
              <a
                href={`/api/newsletters/${encodeURIComponent(featuredCurrent.id)}?download=1`}
                className="inline-flex w-fit border border-ink/30 px-4 py-2 font-display text-base"
              >
                Download current issue
              </a>
            </div>
            <iframe
              src={`/api/newsletters/${encodeURIComponent(featuredCurrent.id)}`}
              title={`${featuredCurrent.title} South Bay Judo newsletter`}
              className="h-[85vh] min-h-[680px] w-full bg-white"
              loading="lazy"
            />
          </article>
        ) : (
          <p className="border border-ink/20 bg-card px-5 py-6 text-ink/70">
            The current newsletter is temporarily unavailable. Please check back soon.
          </p>
        )}

        <div className="mt-10">
          <h3 className="mb-4 font-display text-3xl">{thisYear} newsletters</h3>
          {currentYearPast.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {currentYearPast.map((newsletter) => (
                <li key={newsletter.id}>
                  <a
                    href={`/api/newsletters/${encodeURIComponent(newsletter.id)}?download=1`}
                    className="flex h-full items-center justify-between gap-4 border border-ink/20 bg-card px-5 py-4 transition-colors hover:border-belt"
                  >
                    <span className="font-display text-xl">{newsletter.title}</span>
                    <span className="shrink-0 text-sm underline underline-offset-4">Download PDF</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink/65">No additional {thisYear} newsletters yet.</p>
          )}
        </div>

        {archives.length > 0 && (
          <div className="mt-12 border-t border-ink/15 pt-8">
            <h3 className="mb-4 font-display text-3xl">Past year archives</h3>
            <p className="mb-5 text-ink/65">Select a year to view or download its newsletters.</p>
            <div className="space-y-3">
              {archives.map(([year, newsletters]) => (
                <details key={year} className="group border border-ink/20 bg-card">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-display text-2xl">
                    <span>{year} Archive ({newsletters.length})</span>
                    <span aria-hidden="true" className="text-belt transition-transform group-open:rotate-180">⌄</span>
                  </summary>
                  <ul className="grid gap-3 border-t border-ink/15 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    {newsletters.map((newsletter) => (
                      <li key={newsletter.id}>
                        <a
                          href={`/api/newsletters/${encodeURIComponent(newsletter.id)}?download=1`}
                          className="flex h-full items-center justify-between gap-4 border border-ink/20 px-4 py-3 transition-colors hover:border-belt"
                        >
                          <span className="font-display text-lg">{newsletter.title}</span>
                          <span className="shrink-0 text-sm underline underline-offset-4">Download PDF</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
