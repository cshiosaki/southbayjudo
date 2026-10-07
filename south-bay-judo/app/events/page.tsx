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
          Read the latest issue here, or download a past issue below.
        </p>

        {current ? (
          <article className="overflow-hidden border border-ink/20 bg-card">
            <div className="flex flex-col gap-4 border-b border-ink/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-2xl">{current.title}</h3>
                <p className="text-ink/65">Current newsletter</p>
              </div>
              <a
                href={`/api/newsletters/${encodeURIComponent(current.id)}?download=1`}
                className="inline-flex w-fit border border-ink/30 px-4 py-2 font-display text-base"
              >
                Download current issue
              </a>
            </div>
            <iframe
              src={`/api/newsletters/${encodeURIComponent(current.id)}`}
              title={`${current.title} South Bay Judo newsletter`}
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
          <h3 className="mb-4 font-display text-3xl">Past newsletters</h3>
          {past.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((newsletter) => (
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
            <p className="border border-ink/20 bg-card px-5 py-6 text-ink/70">
              Past newsletters are temporarily unavailable. Please check back soon.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
