import Link from "next/link";
import { getSiteConfig } from "@/lib/config-store";
import { sessionPriceLabel } from "@/lib/sessions";

export default async function SchedulePage() {
  const { sessions, classTimes } = await getSiteConfig();
  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="font-display text-5xl mb-3">2026 Class Schedule</h1>
      <p className="text-ink/70 max-w-xl mb-12">
        Four sessions a year for new and returning students, plus an optional Holiday session in
        November–December for returning students only. Classes meet Tuesdays and Thursdays at the
        Dee Hardison Sports Center, Wilson Park.
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

      <h2 className="font-display text-3xl mb-6">Sessions &amp; Registration Windows</h2>
      <div className="space-y-px bg-ink/10">
        {sessions.map((s) => (
          <div key={s.id} className="bg-canvas p-6 grid sm:grid-cols-2 lg:grid-cols-[1fr_2.25fr_1fr_1.25fr] gap-4 items-start">
            <p className="font-display text-xl sm:col-span-1">{s.label}</p>
            <p className="text-sm sm:col-span-1 lg:whitespace-nowrap">{s.dates} — {sessionPriceLabel(s)}{s.pricingMode === "family_tier" && <span className="text-xs text-ink/50"> (1st / 2nd / 3rd+ child)</span>}</p>
            <p className="text-sm text-ink/70 sm:col-span-1">{s.regWindow}</p>
            <p className="text-xs text-ink/55 sm:col-span-1">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Link href="/register" className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide inline-block">
          Register for a session
        </Link>
      </div>

      <div className="mt-12 pt-8 mat-seam border-ink/15 text-sm text-ink/70 max-w-2xl space-y-2">
        <p>
          Session fees are per family: the tiered price above applies to the 1st, 2nd, and 3rd+
          student from the same family registering for a session.
        </p>
        <p>
          Returning students joining after a session has started, transferring from another club,
          or coming back after a break are prorated at $10/class instead, up to the 1st-student
          price.
        </p>
        <p>
          All students must carry a current USJF membership for insurance purposes — $70/year
          individually, with discounted family plans for 3+ household members.
        </p>
      </div>
    </main>
  );
}
