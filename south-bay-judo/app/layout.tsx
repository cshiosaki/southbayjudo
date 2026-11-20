import type { Metadata } from "next";
import { Barlow_Condensed, Karla } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import MainNavigation from "./main-navigation";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${karla.variable}`}>
      <body className="font-body">
        <header className="bg-ink text-canvas">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-6 py-6 sm:gap-6 sm:py-7">
            <Link href="/" className="flex items-center justify-center gap-3" aria-label="South Bay Judo home">
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
            <MainNavigation />
          </div>
        </header>

        {children}

        <footer className="bg-ink text-canvas mt-24">
          <div className="max-w-4xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-10 text-sm">
            <div className="sm:text-center">
              <p className="font-display text-lg mb-1">Location</p>
              <p>Wilson Park — Dee Hardison Center</p>
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
            <div className="max-w-5xl mx-auto px-6 py-4 text-xs text-canvas/70 text-center space-y-1">
              <p>Building Character — Honor — Respect. A Torrance Charter Club since 1999.</p>
              <p>South Bay Judo is a nonprofit charitable organization recognized under Section 501(c)(3) of the Internal Revenue Code (DLN #17053-063-77700-6).</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
