import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events | South Bay Judo",
  description: "View the South Bay Judo calendar and latest newsletter.",
};

export const dynamic = "force-dynamic";

const CALENDAR_URL =
  "https://calendar.google.com/calendar/embed?src=events%40southbayjudo.com&ctz=America%2FLos_Angeles&mode=MONTH&showTitle=0&showPrint=0&showCalendars=0";

const CURRENT_NEWSLETTER_URL =
  "https://drive.google.com/drive/folders/1EwojE2KomShDWrzSYWHHMYtUp1vyaIJa";
const NEWSLETTER_ARCHIVE_URL =
  "https://drive.google.com/drive/folders/12UTntGH4RQmtXr-ifpfVrG0upVngR7Ur";

export default function EventsPage() {
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
          Open the current issue or browse previous South Bay Judo newsletters.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={CURRENT_NEWSLETTER_URL}
            target="_blank"
            rel="noreferrer"
            className="bg-belt px-5 py-2.5 font-display text-lg text-card"
          >
            Open current newsletter
          </a>
          <a
            href={NEWSLETTER_ARCHIVE_URL}
            target="_blank"
            rel="noreferrer"
            className="border border-ink/30 px-5 py-2.5 font-display text-lg"
          >
            View past newsletters
          </a>
        </div>
      </section>
    </main>
  );
}
