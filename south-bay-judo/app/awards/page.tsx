import Image from "next/image";

const awardWinners = [
  { award: "Newcomer", winners: "Magnus Tran" },
  { award: "Most Improved", winners: "Xairah Ordinario & Enzo Sakaguchi" },
  { award: "Fighting Spirit", winners: "Nicolas Do & Edmund Lo" },
  { award: "Inspirational", winners: "William Tsujimura & Agnes Nagata" },
  { award: "Senseis", winners: "Oliver Suzuki, Jon Connor, Grace Wang & Robbie Midgette" },
  { award: "Best Competitor", winners: "Yuma Sakamoto & Julien Do" },
];

export default function AwardsPage() {
  return (
    <main>
      <section className="bg-ink text-canvas">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <p className="text-gold font-display text-lg uppercase tracking-[0.12em] mb-3">
            South Bay Judo
          </p>
          <h1 className="font-display text-6xl sm:text-7xl leading-none mb-5">Annual Awards</h1>
          <p className="text-lg text-canvas/75 max-w-2xl">
            Recognizing the students, competitors, and volunteers who exemplify the character, effort, and spirit of South Bay Judo.
          </p>
          <p className="mt-4 text-sm text-canvas/55">
            2026 award recipients will be announced in December.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="font-display uppercase tracking-[0.14em] text-belt mb-2">2025</p>
          <h2 className="font-display text-4xl sm:text-5xl">Outstanding Judokas of the Year</h2>
          <p className="mt-3 text-lg text-ink/70">Zachary Ordinario &amp; Manami Takeuchi</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <article className="bg-card border border-ink/10 overflow-hidden">
            <div className="relative aspect-[3/4] bg-ink/5">
              <Image
                src="/images/awards/zachary-ordinario-2025.png"
                alt="Zachary Ordinario holding his 2025 South Bay Judo award"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain"
                priority
              />
            </div>
            <div className="p-7 sm:p-8">
              <p className="font-display uppercase tracking-[0.12em] text-belt mb-2">Outstanding Judoka of the Year</p>
              <h3 className="font-display text-3xl mb-5">Zachary Ordinario</h3>
              <div className="space-y-4 text-ink/80 leading-relaxed">
                <p>
                  Zachary started judo in 2022 as a quiet 10-year-old. He has grown into one of the club&apos;s leaders, works hard every practice, and remains humble in his accomplishments.
                </p>
                <p>
                  Outside of judo, Zachary enjoys guitar, piano, basketball, table tennis, billiards, swimming, baseball, and collecting Pokémon cards. He is a straight-A student who has consistently received awards and recognition, and he participates in his school&apos;s robotics and MESA (Math Engineering Science Achievement) club. He was accepted to CAMS for high school.
                </p>
                <p>
                  Zachary&apos;s character on and off the mat is why South Bay Judo selected him as one of its 2025 Outstanding Judokas of the Year.
                </p>
              </div>
            </div>
          </article>

          <article className="bg-card border border-ink/10 overflow-hidden">
            <div className="relative aspect-[3/4] bg-ink/5">
              <Image
                src="/images/awards/manami-takeuchi-2025.png"
                alt="Manami Takeuchi holding her 2025 South Bay Judo award"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain"
                priority
              />
            </div>
            <div className="p-7 sm:p-8">
              <p className="font-display uppercase tracking-[0.12em] text-belt mb-2">Outstanding Judoka of the Year</p>
              <h3 className="font-display text-3xl mb-5">Manami Takeuchi</h3>
              <div className="space-y-4 text-ink/80 leading-relaxed">
                <p>
                  Anyone who knows Manami knows she has a big heart and is a great supporter of judo and South Bay Judo. She brought her son Romeo to South Bay Judo in 2014 and has supported him throughout his judo journey.
                </p>
                <p>
                  After watching Romeo compete for many years, Manami decided it was time to get on the mat herself. She has practiced judo consistently, became a green belt, and continues to support the dojo while balancing work and family.
                </p>
                <p>
                  Manami has also volunteered at tournaments, including helping with the score table at Nanka events. Her dedication to the sport and the club is why she was recognized as one of South Bay Judo&apos;s 2025 Outstanding Judokas of the Year.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-mat/15">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <p className="font-display uppercase tracking-[0.14em] text-belt mb-2">2025</p>
            <h2 className="font-display text-4xl">Award Winners</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {awardWinners.map((item) => (
              <article key={item.award} className="bg-canvas border border-ink/10 p-6">
                <p className="font-display text-xl text-belt mb-2">{item.award}</p>
                <p className="text-lg text-ink/85">{item.winners}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
