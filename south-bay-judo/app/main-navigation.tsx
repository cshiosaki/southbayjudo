"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/instructors", label: "Instructors" },
  { href: "/events", label: "Events" },
  { href: "/awards", label: "Awards" },
  { href: "/schedule", label: "Schedule" },
  { href: "/register", label: "Register" },
  { href: "/shop", label: "Order Gear" },
  { href: "/support", label: "Support" },
  { href: "/visitor", label: "Visitor Check-In" },
];

export default function MainNavigation() {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Main navigation" className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-2 text-center text-sm sm:gap-x-3 sm:text-base">
      {NAV.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              "rounded-sm border-b-[3px] px-2 py-2 font-medium transition-colors focus-visible:outline-offset-2 sm:px-3 " +
              (isActive
                ? "border-[#C7A76C] bg-[#9C3B28] text-white shadow-sm"
                : "border-transparent text-canvas hover:border-[#C7A76C] hover:bg-white/10 hover:text-gold")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
