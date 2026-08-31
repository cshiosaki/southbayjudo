import Link from "next/link";
import { getSiteConfig } from "@/lib/config-store";

export default async function HomePage() {
  const { sessions } = await getSiteConfig();
  return (
    <main>
      {/* Hero */}
      <section className="bg-ink text-canvas">
        <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-5 gap-10 items-end">
          <div className="md:col-span-3">
            <p className="text-gold font-display text-lg mb-3">Torrance Charter Club, since 1999</p>
            <h1 className="font-display text-6xl sm:text-7xl leading-[0.95] mb-6">
              Judo built on
              <br />
              character, honor,
              <br />
              and respect.
            </h1>
            <p className="text-canvas/80 max-w-md leading-relaxed mb-8">
              Four sessions a year at Wilson Park's Dee Hardison Sports Center — for juniors, youth,
              and adults, ages 5 and up. Throwing, grappling, and the discipline that comes with them.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/register" className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide">
                Register for a session
              </Link>
              <Link href="/schedule" className="border border-canvas/40 px-6 py-3 font-display text-lg tracking-wide">
                View schedule
              </Link>
            </div>
          </div>
          <div className="md:col-span-2 border border-canvas/20 p-6">
            <p className="font-display text-xl text-gold mb-4">Tues &amp; Thurs Classes</p>
            <ul className="space-y-3 text-sm text-canvas/85">
              <li className="mat-seam border-canvas/15 pt-3 first:border-0 first:pt-0">
                5:00–6:15pm — Juniors, 5–12
              </li>
              <li className="mat-seam border-canvas/15 pt-3">6:30–7:45pm — Juniors, 5–14</li>
              <li className="mat-seam border-canvas/15 pt-3">8:00–9:15pm — Older youth &amp; adults, 13+</li>
            </ul>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-5 gap-12">
        <div className="md:col-span-2">
          <h2 className="font-display text-3xl mb-4">A yearlong program, four sessions at a time</h2>
        </div>
        <div className="md:col-span-3 text-ink/85 leading-relaxed space-y-4">
          <p>
            Judo is an Olympic sport combining throwing and grappling technique with an emphasis on
            movement, leverage, balance, and skill. It's a genuine cardio workout that builds
            stamina, strength, and endurance for kids, youth, and adults alike — and it teaches
            mental toughness, discipline, and self-control alongside self-defense.
          </p>
          <p>
            Each session runs about 9–10 weeks (18 classes), twice a week on Tuesdays and Thursdays,
            at the Dee Hardison Sports Center in Wilson Park. New and returning students are welcome
            each quarter; the Holiday session in November–December is a conditioning and competition
            workout open to returning students only.
          </p>
        </div>
      </section>

      {/* Sessions strip */}
      <section className="bg-mat/15">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="font-display text-3xl mb-8">2026 Sessions</h2>
          <div className="grid sm:grid-cols-5 gap-px bg-ink/10">
            {sessions.map((s) => (
              <div key={s.id} className="bg-canvas p-5">
                <p className="font-display text-xl mb-1">{s.label.replace(/ — .*/, "")}</p>
                <p className="text-sm text-ink/70">{s.dates}{!s.allowNew && " (returning students)"}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-ink/70 text-sm max-w-lg">
            Registration windows open a few weeks before each session — see the{" "}
            <Link href="/schedule" className="underline decoration-belt decoration-2 underline-offset-2">
              full schedule
            </Link>{" "}
            for exact dates.
          </p>
        </div>
      </section>
    </main>
  );
}
