import type { Metadata } from "next";
import { Barlow_Condensed, Karla } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
});
const karla = Karla({ subsets: ["latin"], variable: "--font-karla" });

export const metadata: Metadata = {
  title: "South Bay Judo",
  description: "Torrance Charter Club — judo for juniors, youth, and adults since 1999.",
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/events", label: "Events" },
  { href: "/schedule", label: "Schedule" },
  { href: "/register", label: "Register" },
  { href: "/visitor", label: "Visitor Check-In" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${karla.variable}`}>
      <body className="font-body">
        <div className="bg-belt text-card text-center text-sm py-1.5 px-4">
          Stripe test mode — sandbox checkout only. No real charges will be made.
        </div>

        <header className="bg-ink text-canvas">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
            <Link href="/" className="flex items-center gap-3" aria-label="South Bay Judo home">
              <Image
                src="/images/south-bay-judo-logo.webp"
                alt=""
                width={58}
                height={58}
                className="h-14 w-14 rounded-full bg-white object-cover"
                priority
              />
              <span>
                <span className="block font-display text-2xl tracking-tight leading-none">South Bay Judo</span>
                <span className="mt-1 block text-[11px] uppercase tracking-[0.18em] text-canvas/60">
                  Torrance · Since 1999
                </span>
              </span>
            </Link>
            <nav className="flex gap-6 text-sm">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-gold transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {children}

        <footer className="bg-ink text-canvas mt-24">
          <div className="max-w-5xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="font-display text-lg mb-1">Location</p>
              <p>Wilson Park — Dee Hardison Sports Center</p>
              <p>2400 Jefferson St, Torrance, CA 90501</p>
            </div>
            <div>
              <p className="font-display text-lg mb-1">Hours</p>
              <p>Tuesday &amp; Thursday</p>
              <p>4:45pm – 9:15pm</p>
            </div>
            <div>
              <p className="font-display text-lg mb-1">Contact</p>
              <p>info@southbayjudo.com</p>
              <p>(424) 392-4732</p>
            </div>
          </div>
          <div className="mat-seam border-white/10">
            <p className="max-w-5xl mx-auto px-6 py-4 text-xs text-canvas/60">
              Building Character — Honor — Respect. A Torrance Charter Club since 1999.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
