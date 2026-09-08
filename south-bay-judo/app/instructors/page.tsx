import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Instructors | South Bay Judo",
  description:
    "Meet the volunteer instructors who lead South Bay Judo classes, competition training, and club programs in Torrance.",
};

const assistantInstructors = [
  {
    rank: "Yondan · 4th degree black belt",
    names: ["Jefferey Tejero"],
  },
  {
    rank: "Sandan · 3rd degree black belt",
    names: ["You Matsutani", "Shane Shiosaki", "Alan Honda"],
  },
  {
    rank: "Nidan · 2nd degree black belt",
    names: ["Yuko Felde", "Machiko Matsutani", "Maria Matsutani", "Marina Matsutani"],
  },
  {
    rank: "Shodan · 1st degree black belt",
    names: [],
  },
  {
    rank: "Ikkyu · 1st degree brown belt",
    names: ["Mark Williams"],
  },
  {
    rank: "Nikyu · 2nd degree brown belt",
    names: ["Romeo Sangdee-Takeuchi"],
  },
  {
    rank: "Sankyu · 3rd degree brown belt",
    names: ["Luis Vazquez"],
  },
];

const pastInstructors = [
  {
    names: "Craig Shiosaki · John Hernandez",
    rank: "Sandan · 3rd degree black belt",
  },
  {
    names: "Myles Honda · David Honda",
    rank: "Nidan · 2nd degree black belt",
  },
  {
    names: "Joan Shiosaki · Sandy Honda · Matt Sawada · Chris Williams · Nancy Williams",
    rank: "Shodan · 1st degree black belt",
  },
  {
    names: "Skyler Shiosaki · Cheyenne Fu",
    rank: "Ikkyu · 1st degree brown belt",
  },
];

export default function InstructorsPage() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="mb-2 font-display uppercase tracking-[0.14em] text-belt">Our teaching team</p>
            <h1 className="mb-6 font-display text-5xl leading-none sm:text-6xl">Meet the instructors</h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink/75">
              South Bay Judo is led by experienced volunteer instructors who teach strong fundamentals,
              safe practice, competition skills, and respect for every training partner.
            </p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden bg-ink">
            <Image
              src="/images/south-bay-judo-practice.webp"
              alt="South Bay Judo instructors guiding students during class"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-ink text-canvas">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10">
            <p className="mb-2 font-display uppercase tracking-[0.14em] text-gold">Club leadership</p>
            <h2 className="font-display text-4xl sm:text-5xl">Head instructors</h2>
          </div>
          <div className="grid gap-px bg-canvas/20 md:grid-cols-2">
            <article className="bg-ink p-7 sm:p-9">
              <p className="mb-2 font-display text-lg uppercase tracking-wide text-gold">Head Instructor</p>
              <h3 className="font-display text-4xl">Milton Shiosaki</h3>
              <p className="mt-1 text-canvas/65">5th degree black belt</p>
              <p className="mt-6 leading-relaxed text-canvas/80">
                Sensei Milton has taught judo for more than 40 years. He coordinates South Bay Judo’s
                programs, fundamentals, values, and competition training, and coaches athletes at local,
                state, and national events.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-canvas/65">
                USJF and USA Judo member · USA Judo coach · Safe Sport, CDC Concussion, and First Aid/CPR certified
              </p>
            </article>
            <article className="bg-ink p-7 sm:p-9">
              <p className="mb-2 font-display text-lg uppercase tracking-wide text-gold">Head Advisor &amp; Club Administrator</p>
              <h3 className="font-display text-4xl">Ed Shiosaki</h3>
              <p className="mt-1 text-canvas/65">6th degree black belt</p>
              <p className="mt-6 leading-relaxed text-canvas/80">
                Sensei Ed founded South Bay Judo in 1999 and has more than 45 years of judo experience.
                He has coached and developed national and international champions.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-canvas/65">
                USJF and USA Judo member · USA Judo coach · Safe Sport, CDC Concussion, and First Aid/CPR certified
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="mb-2 font-display uppercase tracking-[0.14em] text-belt">On the mat</p>
            <h2 className="font-display text-4xl leading-none sm:text-5xl">Assistant instructors</h2>
            <p className="mt-5 max-w-sm leading-relaxed text-ink/70">
              Our coaching team brings many levels of experience to every class and helps students
              progress at their own pace.
            </p>
          </div>
          <div className="border-t border-ink/20">
            {assistantInstructors.filter((group) => group.names.length > 0).map((group) => (
              <article key={group.rank} className="grid gap-3 border-b border-ink/15 py-6 sm:grid-cols-[15rem_1fr] sm:gap-8">
                <h3 className="font-display text-xl text-belt">{group.rank}</h3>
                <p className="leading-relaxed text-ink/85">{group.names.join(" · ")}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink/15 bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-[0.75fr_1.25fr] md:gap-12">
          <div>
            <p className="mb-1 text-sm uppercase tracking-[0.12em] text-belt">With appreciation</p>
            <h2 className="font-display text-3xl leading-none">Past instructors</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/65">
              We recognize the instructors who have shared their time, knowledge, and care with the
              South Bay Judo community. Though they are not currently teaching, their contributions
              remain part of our club’s story.
            </p>
          </div>
          <ul className="grid gap-px bg-ink/15 sm:grid-cols-2" aria-label="Past South Bay Judo instructors">
            {pastInstructors.map((group) => (
              <li key={group.rank} className="bg-canvas px-5 py-3">
                <p className="font-display text-lg">{group.names}</p>
                <p className="text-xs text-ink/55">{group.rank}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-mat/15">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-7 px-6 py-12 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-3xl">Questions for the coaching team?</p>
            <p className="mt-2 text-ink/70">We’re happy to help you choose the right class.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4">
            <a href="mailto:instructors@southbayjudo.com" className="border border-ink/30 px-6 py-3 font-display text-lg tracking-wide">
              Email instructors
            </a>
            <Link href="/schedule" className="bg-belt px-6 py-3 font-display text-lg tracking-wide text-card">
              View schedule
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
