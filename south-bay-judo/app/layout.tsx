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
  { href: "/instructors", label: "Instructors" },
  { href: "/events", label: "Events" },
  { href: "/schedule", label: "Schedule" },
  { href: "/register", label: "Register" },
  { href: "/shop", label: "Order Gear" },
  { href: "/visitor", label: "Visitor Check-In" },
  { href: "/support", label: "Support SBJ" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${karla.variable}`}>
      <body className="font-body">
        <header className="bg-ink text-canvas">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-5">
            <Link href="/" className="flex items-center gap-3" aria-label="South Bay Judo home">
              <Image
                src="/images/south-bay-judo-logo.webp"
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 rounded-full bg-white object-cover"
                priority
              />
              <span>
                <span className="block font-display text-3xl tracking-tight leading-none">South Bay Judo</span>
                <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-canvas/60">
                  Torrance · Since 1999
                </span>
              </span>
            </Link>
            <nav className="flex flex-wrap justify-end gap-x-7 gap-y-2 text-base">
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
          <div className="max-w-4xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-10 text-sm">
            <div className="sm:text-center">
              <p className="font-display text-lg mb-1">Location</p>
              <p>Wilson Park — Dee Hardison Sports Center</p>
              <p>2400 Jefferson St, Torrance, CA 90501</p>
            </div>
            <div className="sm:text-center">
              <p className="font-display text-lg mb-1">Hours</p>
              <p>Tuesday &amp; Thursday</p>
              <p>4:45pm – 9:15pm</p>
            </div>
            <div className="sm:text-center">
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
