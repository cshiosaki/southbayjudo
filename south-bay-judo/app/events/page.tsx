import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_EVENT_DOCUMENT, getEventDocument } from "@/lib/events-store";

export const metadata: Metadata = {
  title: "Events | South Bay Judo",
  description: "View the latest South Bay Judo event flyer and information.",
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const document = (await getEventDocument()) ?? DEFAULT_EVENT_DOCUMENT;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-1 font-display text-sm uppercase tracking-[0.14em] text-belt">What’s happening</p>
      <h1 className="mb-3 font-display text-5xl">Events</h1>
      <p className="mb-12 max-w-xl text-ink/70">
        Find the latest South Bay Judo event details, schedules, and announcements here.
      </p>

      <section>
        {document ? (
          <div>
            <div className="mb-6 flex flex-wrap justify-end gap-3 border-b border-ink/15 pb-6">
              <div className="flex flex-wrap gap-3">
                <a
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-ink/30 px-5 py-2.5 font-display text-lg"
                >
                  Open PDF
                </a>
                <a
                  href={document.downloadUrl || document.url}
                  className="bg-belt px-5 py-2.5 font-display text-lg text-card"
                >
                  Download PDF
                </a>
              </div>
            </div>
            <iframe
              src={`${document.url}#toolbar=1&navpanes=0`}
              title={document.title}
              className="h-[82vh] min-h-[640px] w-full border border-ink/20 bg-card sm:min-h-[760px]"
            />
            <p className="mt-4 text-sm text-ink/55">
              If the flyer does not appear above, use the Open PDF button.
            </p>
          </div>
        ) : (
          <div className="border border-ink/15 bg-card p-8 sm:p-12">
            <p className="mb-2 font-display text-3xl">No event flyer is posted yet.</p>
            <p className="max-w-xl leading-relaxed text-ink/65">
              Please check back soon or view the class schedule for regular session dates.
            </p>
            <Link href="/schedule" className="mt-7 inline-block bg-belt px-5 py-2.5 font-display text-lg text-card">
              View schedule
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
