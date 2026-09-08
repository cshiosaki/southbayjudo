import Image from "next/image";
import Link from "next/link";
import { getSiteConfig } from "@/lib/config-store";

export default async function HomePage() {
  const { sessions } = await getSiteConfig();
  return (
    <main>
      {/* Hero */}
      <section className="bg-ink text-canvas">
        <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <p className="text-gold font-display text-lg uppercase tracking-[0.12em] mb-3">
              Torrance Charter Club · Since 1999
            </p>
            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl leading-[0.88] mb-7">
              Judo built on
              <br />
              character, honor,
              <br />
              and respect.
            </h1>
            <p className="text-lg text-canvas/80 max-w-xl leading-relaxed mb-8">
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
          <div className="relative min-h-[410px] sm:min-h-[520px] overflow-hidden border border-canvas/20">
            <Image
              src="/images/south-bay-judo-class.webp"
              alt="South Bay Judo students lined up on the mat during class"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/75 to-transparent px-6 pb-6 pt-20">
              <p className="font-display text-2xl">A place to learn, grow, and belong.</p>
              <p className="mt-1 text-sm text-canvas/75">Classes for students age 5 through adult.</p>
            </div>
          </div>
        </div>
        <div className="border-t border-canvas/15">
          <div className="max-w-6xl mx-auto px-6 py-5 grid sm:grid-cols-3 gap-4 sm:gap-0 text-sm text-canvas/85">
            <p className="sm:pr-6"><strong className="font-display text-gold text-lg block">Class 1</strong>5:00–6:15pm · Juniors, 5–12</p>
            <p className="sm:border-l sm:border-canvas/15 sm:px-6"><strong className="font-display text-gold text-lg block">Class 2</strong>6:30–7:45pm · Juniors, 5–14</p>
            <p className="sm:border-l sm:border-canvas/15 sm:pl-6"><strong className="font-display text-gold text-lg block">Class 3</strong>8:00–9:15pm · Youth &amp; adults, 13+</p>
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

      {/* Life at the dojo */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-3 relative min-h-[320px] sm:min-h-[470px] overflow-hidden bg-ink">
            <Image
              src="/images/south-bay-judo-practice.webp"
              alt="South Bay Judo students practicing groundwork with instructors at Wilson Park"
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="lg:col-span-2 bg-card border-t-4 border-belt p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <p className="font-display uppercase tracking-[0.14em] text-belt mb-3">On the mat</p>
              <h2 className="font-display text-4xl sm:text-5xl leading-none mb-6">Strong fundamentals. Stronger people.</h2>
              <p className="text-ink/75 leading-relaxed">
                Students learn how to fall safely, throw with control, work from the ground, and train
                with respect for every partner. Volunteer instructors guide each class from first steps
                through competition-level practice.
              </p>
            </div>
            <blockquote className="mt-10 border-l-2 border-gold pl-5 text-ink/80">
              <p className="font-display text-2xl leading-tight">“It is not important to be better than someone else, but to be better than yesterday.”</p>
              <footer className="mt-3 text-sm">— Dr. Jigoro Kano</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Sessions strip */}
      <section className="bg-mat/15">
        <div className="max-w-6xl mx-auto px-6 py-16">
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
