import Link from "next/link";

const rows = [
  ["0000", "~3'6\" / 106.7", "—", "—"],
  ["000", "~4' / 122", "—", "—"],
  ["00", "4' / 122", "4'4\" / 132", "—"],
  ["0", "4'4\" / 132", "4'6\" / 137", "—"],
  ["1", "4'6\" / 137", "4'9\" / 144.8", "—"],
  ["2", "4'10\" / 147.3", "5'3\" / 160", "110 / 50"],
  ["3", "5'2\" / 157.5", "5'7\" / 170", "135–160 / 61–73"],
  ["4", "5'6\" / 167.6", "5'11\" / 180.3", "160–190 / 72–86"],
  ["5", "5'10\" / 177.8", "6'3\" / 190.5", "195–200 / 89–100"],
  ["6", "6'2\" / 188", "6'6\" / 198.1", "230–250 / 104–113"],
  ["7", "6'3\" / 190.5", "6'7\" / 200.7", "260+ / 118+"],
  ["8", "6'3\" / 190.5", "6'7\" / 200.7", "300–340 / 136–154"],
];

export default function GiSizeChartPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
      <p className="mb-2 font-display uppercase tracking-[0.14em] text-belt">FUJI Single Weave</p>
      <h1 className="font-display text-5xl sm:text-6xl mb-4">Judo Gi Size Chart</h1>
      <p className="text-ink/65 mb-8">
        Use this chart for the white FUJI Single Weave gi offered through South Bay Judo.
      </p>

      <div className="overflow-x-auto bg-card border border-ink/10">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/15 text-left">
              <th className="p-4 font-display text-lg">Size</th>
              <th className="p-4 font-display text-lg">From FT / CM</th>
              <th className="p-4 font-display text-lg">To FT / CM</th>
              <th className="p-4 font-display text-lg">Weight LB / KG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-b border-ink/10 last:border-b-0">
                {row.map((cell, i) => (
                  <td key={i} className={"p-4 " + (i === 0 ? "font-semibold" : "")}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 bg-card border-t-4 border-belt p-6 sm:p-8">
        <h2 className="font-display text-2xl mb-3">Care and sizing instructions</h2>
        <p className="text-sm leading-relaxed text-ink/70">
          FUJI gis are preshrunk, but some shrinkage can still occur. Cold wash and hang dry are
          recommended; most shrinkage occurs with hot machine washing and drying. If you are between
          sizes, choose the larger size. Items may be returned as long as they have not been washed
          or worn for practice.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/shop" className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide">
          Back to Gear Store
        </Link>
        <Link href="/register" className="border border-ink/30 px-6 py-3 font-display text-lg tracking-wide">
          Back to Registration
        </Link>
      </div>
    </main>
  );
}
