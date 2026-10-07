import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events & Newsletters | South Bay Judo",
  description: "View South Bay Judo events and read or download current and past newsletters.",
};

export const dynamic = "force-dynamic";

const CALENDAR_URL =
  "https://calendar.google.com/calendar/embed?src=events%40southbayjudo.com&ctz=America%2FLos_Angeles&mode=MONTH&showTitle=0&showPrint=0&showCalendars=0";

const CURRENT_NEWSLETTER_ID = "1LdgC8MuOeZTTrUn88lrtL_KRHIa5neop";
const CURRENT_NEWSLETTER_PREVIEW_URL = `https://drive.google.com/file/d/${CURRENT_NEWSLETTER_ID}/preview`;
const CURRENT_NEWSLETTER_DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${CURRENT_NEWSLETTER_ID}`;

const PAST_NEWSLETTERS = [
  {
    title: "September 2026",
    fileName: "09 SBJ E-News Sept-2026 Newsletter Final.pdf",
    id: "1hq66-9dbFcP3xzFGdkO_pfr2FS3rxxGJ",
  },
  {
    title: "August 2026",
    fileName: "08 SBJ E-News Aug-2026 Newsletter Final.pdf",
    id: "1IsGdqhsMUSkQGZLHbnA4WMYC5b957Wwb",
  },
  {
    title: "July 2026",
    fileName: "07 SBJ E-News July-2026 Newsletter.pdf",
    id: "1VELDFWP_pyyhvSsH2D0Ufrp6BlOLQcGH",
  },
  {
    title: "June 2026",
    fileName: "06 SBJ E-News June-2026 Newsletter.pdf",
    id: "1L27CEMfODOnQW4-i80hMxJq8quRklVvJ",
  },
  {
    title: "May 2026",
    fileName: "05 SBJ E-News May-2026 Newsletter.pdf",
    id: "1kvca07-GN8HgoBYOxB9OqwoltLPyft5s",
  },
  {
    title: "April 2026",
    fileName: "04 SBJ E-News Apr-2026 Newsletter.pdf",
    id: "1k9mn__wn6Gn_wzoeALL_Sf28ZLg0e62u",
  },
  {
    title: "March 2026",
    fileName: "03 SBJ E-News Mar 2026 Newsletter.pdf",
    id: "1jjonx7qaRid5Eh2vGta7d3QQqC5HQFID",
  },
  {
    title: "February 2026",
    fileName: "02 SBJ-E-News-Feb 2026 Newsletter.pdf",
    id: "1n5jISWZUQndVdg84LjUjd_fZ8NDejKGG",
  },
  {
    title: "January–March 2026",
    fileName: "01 SBJ E-News Vol 01-2026 (Jan to Mar).pdf",
    id: "1OKUTPw7abnwTJda3X6zG_t2N-RrOHog_",
  },
];

function downloadUrl(id: string) {
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

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
          Read the latest issue here, or download a past issue below.
        </p>

        <article className="overflow-hidden border border-ink/20 bg-card">
          <div className="flex flex-col gap-4 border-b border-ink/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-2xl">October 2026</h3>
              <p className="text-ink/65">Current newsletter</p>
            </div>
            <a
              href={CURRENT_NEWSLETTER_DOWNLOAD_URL}
              className="inline-flex w-fit border border-ink/30 px-4 py-2 font-display text-base"
            >
              Download October issue
            </a>
          </div>
          <iframe
            src={CURRENT_NEWSLETTER_PREVIEW_URL}
            title="October 2026 South Bay Judo newsletter"
            className="h-[85vh] min-h-[680px] w-full bg-white"
            loading="lazy"
            allow="autoplay"
          />
        </article>

        <div className="mt-10">
          <h3 className="mb-4 font-display text-3xl">Past newsletters</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PAST_NEWSLETTERS.map((newsletter) => (
              <li key={newsletter.id}>
                <a
                  href={downloadUrl(newsletter.id)}
                  download={newsletter.fileName}
                  className="flex h-full items-center justify-between gap-4 border border-ink/20 bg-card px-5 py-4 transition-colors hover:border-belt"
                >
                  <span className="font-display text-xl">{newsletter.title}</span>
                  <span className="shrink-0 text-sm underline underline-offset-4">Download PDF</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
