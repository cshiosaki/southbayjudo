import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our History | South Bay Judo",
  description:
    "Learn how judo began in Japan and how South Bay Judo grew from eight students in 1999 into a Torrance community club.",
};

const judoTimeline = [
  {
    year: "1882",
    title: "The Kodokan opens",
    body: "Jigoro Kano founded Kodokan Judo in Tokyo, shaping techniques from traditional jujutsu into a modern system of physical education and personal development.",
  },
  {
    year: "1964",
    title: "Judo enters the Olympics",
    body: "Men’s judo made its Olympic debut at the Tokyo Games, bringing the sport to an even wider international audience.",
  },
  {
    year: "1992",
    title: "Women’s judo joins the program",
    body: "Women’s judo became an official Olympic medal sport at the Barcelona Games after appearing as a demonstration event in 1988.",
  },
  {
    year: "Today",
    title: "A worldwide practice",
    body: "Judo is practiced around the world as a competitive sport, a method of self-defense, and a way to build confidence, discipline, and respect.",
  },
];

const clubTimeline = [
  {
    year: "Sept. 27, 1999",
    title: "South Bay Judo begins",
    body: "Ed and Joan Shiosaki founded the club with support from the City of Torrance, the Torrance Cultural Arts Center, and Parks and Recreation. The first class had four instructors and eight students.",
  },
  {
    year: "First session",
    title: "Eight students become seventeen",
    body: "The club grew quickly, even while practicing on soft gymnastics mats that connected on only two sides. The equipment was modest, but the community and the joy of training were already strong.",
  },
  {
    year: "A few years later",
    title: "The community builds a real mat",
    body: "A successful Super Bowl fundraiser—supported by members, friends, local businesses, sponsors, and neighboring clubs—helped purchase approximately 775 square feet of tatami mats.",
  },
  {
    year: "Today",
    title: "More than 100 members strong",
    body: "South Bay Judo now trains at the Dee Hardison Sports Center in Wilson Park. The nonprofit Torrance Charter Program is still powered by volunteer instructors and staff serving youth, families, and adults.",
  },
];

export default function HistoryPage() {
  return (
    <main>
      <section className="bg-ink text-canvas">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 font-display text-lg uppercase tracking-[0.14em] text-gold">
              Tradition in motion
            </p>
            <h1 className="mb-7 font-display text-6xl leading-[0.9] sm:text-7xl">
              From the Kodokan to the South Bay
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-canvas/80">
              Judo began as more than a fighting system. It was created as a way to train the body,
              sharpen the mind, and help people grow together. That purpose still guides every class
              at South Bay Judo.
            </p>
          </div>
          <div className="relative min-h-[350px] overflow-hidden border border-canvas/20 sm:min-h-[470px]">
            <Image
              src="/images/jigoro-kano.webp"
              alt="Historic portrait of Jigoro Kano, founder of Kodokan Judo"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="bg-black object-contain"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-5 pb-4 pt-16">
              <p className="font-display text-xl">Jigoro Kano</p>
              <p className="text-sm text-canvas/70">Founder of Kodokan Judo</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.5fr] lg:gap-16">
          <div>
            <p className="mb-2 font-display uppercase tracking-[0.14em] text-belt">The gentle way</p>
            <h2 className="font-display text-4xl leading-none sm:text-5xl">A short history of judo</h2>
          </div>
          <div className="border-t border-ink/20">
            {judoTimeline.map((item) => (
              <article key={item.year} className="grid gap-3 border-b border-ink/15 py-7 sm:grid-cols-[7rem_1fr] sm:gap-8">
                <p className="font-display text-2xl text-belt">{item.year}</p>
                <div>
                  <h3 className="mb-2 font-display text-2xl">{item.title}</h3>
                  <p className="max-w-2xl leading-relaxed text-ink/75">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-mat/15">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-9 max-w-2xl">
            <p className="mb-2 font-display uppercase tracking-[0.14em] text-belt">Kano’s guiding ideas</p>
            <h2 className="font-display text-4xl sm:text-5xl">Strength with a purpose</h2>
          </div>
          <div className="grid gap-px bg-ink/15 md:grid-cols-2">
            <article className="bg-card p-8 sm:p-10">
              <p className="mb-3 font-display text-2xl text-belt">Seiryoku-Zenyo</p>
              <h3 className="mb-4 font-display text-3xl">Best use of energy</h3>
              <p className="leading-relaxed text-ink/75">
                Use mind and body efficiently. On the mat, that means timing, balance, and technique
                instead of relying on strength alone. Away from the mat, it means applying effort
                thoughtfully.
              </p>
            </article>
            <article className="bg-card p-8 sm:p-10">
              <p className="mb-3 font-display text-2xl text-belt">Jita-Kyoei</p>
              <h3 className="mb-4 font-display text-3xl">Mutual welfare and benefit</h3>
              <p className="leading-relaxed text-ink/75">
                We improve through one another. Every safe throw, respectful bow, and helpful training
                partner reflects the idea that individual progress and the well-being of the group
                belong together.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 grid items-end gap-8 md:grid-cols-2">
          <div>
            <p className="mb-2 font-display uppercase tracking-[0.14em] text-belt">Our club</p>
            <h2 className="font-display text-5xl leading-none sm:text-6xl">The South Bay Judo story</h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-ink/75">
            What started with eight students in a community arts center grew through volunteer effort,
            local support, and a shared love of judo.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:sticky lg:top-8 lg:grid-cols-1 lg:self-start">
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden bg-ink">
                <Image
                  src="/images/south-bay-judo-early-group.webp"
                  alt="One of the first South Bay Judo classes gathered on the mat"
                  fill
                  sizes="(min-width: 1024px) 45vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-2 text-sm text-ink/60">One of the first South Bay Judo classes</figcaption>
            </figure>
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden bg-ink">
                <Image
                  src="/images/south-bay-judo-early-instructors.webp"
                  alt="The original South Bay Judo instructors gathered on the mat"
                  fill
                  sizes="(min-width: 1024px) 45vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-2 text-sm text-ink/60">The original South Bay Judo instructors</figcaption>
            </figure>
          </div>
          <div className="border-t border-ink/20">
            {clubTimeline.map((item) => (
              <article key={item.title} className="border-b border-ink/15 py-7">
                <p className="mb-2 font-display text-xl text-belt">{item.year}</p>
                <h3 className="mb-3 font-display text-3xl">{item.title}</h3>
                <p className="leading-relaxed text-ink/75">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-canvas">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 px-6 py-14 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 font-display uppercase tracking-[0.14em] text-gold">Carry the tradition forward</p>
            <h2 className="font-display text-4xl sm:text-5xl">Your first class is the next chapter.</h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4">
            <Link href="/schedule" className="border border-canvas/40 px-6 py-3 font-display text-lg tracking-wide">
              View schedule
            </Link>
            <Link href="/register" className="bg-belt px-6 py-3 font-display text-lg tracking-wide text-card">
              Register
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-10 text-sm text-ink/60">
        <p>
          Historical references: {" "}
          <a className="underline underline-offset-2" href="https://kodokanjudoinstitute.org/en/doctrine/history/" target="_blank" rel="noreferrer">
            Kodokan Judo Institute
          </a>
          , {" "}
          <a className="underline underline-offset-2" href="https://www.olympics.com/en/sports/judo/" target="_blank" rel="noreferrer">
            Olympics.com
          </a>
          , and the {" "}
          <a className="underline underline-offset-2" href="https://www.southbayjudo.com/home-5-4" target="_blank" rel="noreferrer">
            South Bay Judo archive
          </a>
          . Jigoro Kano portrait: {" "}
          <a className="underline underline-offset-2" href="https://commons.wikimedia.org/wiki/File:Jigoro-Kano-BW-4375px.jpg" target="_blank" rel="noreferrer">
            Wikimedia Commons, public domain
          </a>
          .
        </p>
      </section>
    </main>
  );
}
