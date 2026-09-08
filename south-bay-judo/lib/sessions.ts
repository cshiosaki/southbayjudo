/**
 * ═══════════════════════════════════════════════════════════════
 * SESSION, PRICING & MEMBERSHIP SETTINGS — edit via /admin, or here
 * ═══════════════════════════════════════════════════════════════
 * These are the fallback defaults (used if the admin page's Global Config
 * store isn't connected yet). Session dates/prices/class times are
 * editable live from /admin once that's set up — see README.
 *
 * PRICING MODEL (per the club's real fee schedule):
 * - Regular sessions (1Q–4Q) charge per FAMILY, tiered by how many kids
 *   from the same family are enrolling in that session: 1st student full
 *   price, 2nd cheaper, 3rd+ cheapest.
 * - A RETURNING student who is joining late, transferring from another
 *   club, or coming back after a break gets prorated at $10/class instead
 *   of the family-tier price, capped at the 1st-student price.
 * - The Holiday session is flat-priced (not family-tiered), since it's a
 *   different kind of program (conditioning/competition, returning
 *   students only).
 */

export interface SessionConfig {
  id: string;
  label: string;
  dates: string;
  regWindow: string;
  note?: string;
  registrationOpen?: boolean;
  allowNew: boolean;
  priceLabelOverride?: string;
  pricingMode: "family_tier" | "flat";
  flatPrice?: number; // used when pricingMode === "flat"
  familyTierFirst?: number; // used when pricingMode === "family_tier"
  familyTierSecond?: number;
  familyTierThirdPlus?: number;
}

export const SESSIONS: SessionConfig[] = [
  {
    id: "sess_4q",
    label: "4Q — Fall 2026",
    dates: "Aug 18 – Nov 5",
    regWindow: "Registration: Jul 27 – Aug 12",
    note: "No classes Aug 31–Sept 18 (gym & MPR closed for renovation). No classes Oct 22, 27, 29, Nov 3 & 5 (election).",
    registrationOpen: true,
    allowNew: true,
    pricingMode: "family_tier",
    familyTierFirst: 180,
    familyTierSecond: 160,
    familyTierThirdPlus: 140,
  },
  {
    id: "sess_5q",
    label: "Holiday Session 2026",
    dates: "Nov 10 – Dec 15",
    regWindow: "Registration: Oct 12 – Oct 30",
    note: "No class Nov 26. Returning students only.",
    registrationOpen: true,
    allowNew: false,
    pricingMode: "flat",
    flatPrice: 120,
  },
  {
    id: "sess_2027_1q",
    label: "1Q — Winter 2027",
    dates: "Jan 12 – Mar 11",
    regWindow: "Registration dates to be announced",
    note: "18 classes. Session break Mar 16 & 18.",
    registrationOpen: false,
    allowNew: true,
    pricingMode: "family_tier",
    familyTierFirst: 180,
    familyTierSecond: 160,
    familyTierThirdPlus: 140,
    priceLabelOverride: "Pricing to be announced",
  },
  {
    id: "sess_2027_2q",
    label: "2Q — Spring 2027",
    dates: "Mar 23 – May 20",
    regWindow: "Registration dates to be announced",
    note: "18 classes. Session break May 25 & 27 and Jun 1 & 3.",
    registrationOpen: false,
    allowNew: true,
    pricingMode: "family_tier",
    familyTierFirst: 180,
    familyTierSecond: 160,
    familyTierThirdPlus: 140,
    priceLabelOverride: "Pricing to be announced",
  },
  {
    id: "sess_2027_3q",
    label: "3Q — Summer 2027",
    dates: "Jun 8 – Aug 10",
    regWindow: "Registration dates to be announced",
    note: "18 classes. No class Jul 6. Session break Aug 17 & 19.",
    registrationOpen: false,
    allowNew: true,
    pricingMode: "family_tier",
    familyTierFirst: 180,
    familyTierSecond: 160,
    familyTierThirdPlus: 140,
    priceLabelOverride: "Pricing to be announced",
  },
  {
    id: "sess_2027_4q",
    label: "4Q — Fall 2027",
    dates: "Aug 24 – Oct 26",
    regWindow: "Registration dates to be announced",
    note: "18 classes. No class Sept 7. Session break Oct 28.",
    registrationOpen: false,
    allowNew: true,
    pricingMode: "family_tier",
    familyTierFirst: 180,
    familyTierSecond: 160,
    familyTierThirdPlus: 140,
    priceLabelOverride: "Pricing to be announced",
  },
  {
    id: "sess_2027_5q",
    label: "Holiday Session 2027",
    dates: "Nov 2 – Dec 16",
    regWindow: "Registration dates to be announced",
    note: "Holiday Session meets Nov 2 & 4, then Nov 9–Dec 16; no class Nov 11 or Nov 25. Class times: 6:00–7:30pm and 7:45–9:15pm. Returning students only.",
    registrationOpen: false,
    allowNew: false,
    pricingMode: "flat",
    flatPrice: 120,
    priceLabelOverride: "Pricing to be announced",
  },
];

export function sessionPriceLabel(s: SessionConfig): string {
  if (s.priceLabelOverride) return s.priceLabelOverride;
  if (s.pricingMode === "flat") return `$${s.flatPrice}`;
  return `$${s.familyTierFirst} / $${s.familyTierSecond} / $${s.familyTierThirdPlus}+`;
}

export interface ClassTimeConfig {
  id: string;
  label: string;
  age: string;
  time: string;
}

export const CLASS_TIMES: ClassTimeConfig[] = [
  { id: "ct1", label: "Class 1", age: "Juniors, 5–12", time: "5:00–6:15pm" },
  { id: "ct2", label: "Class 2", age: "Juniors, 5–14", time: "6:30–7:45pm" },
  { id: "ct3", label: "Class 3", age: "Older youth & adults, 13+", time: "8:00–9:15pm" },
];

// ---------- USJF national membership ----------
// USJF is the federation the club actually requires (per the club's own
// fee schedule and guest-registration confirmation). USA Judo
// are still selectable in the form for students who hold those instead.

export const MEMBERSHIP_FEE = 70; // USJF individual annual membership

/** Discounted USJF family plan — covers everyone in the household, cheaper than paying individually once 3+ people need membership. */
export function familyMembershipFee(memberCount: number): number {
  if (memberCount < 3) return 0; // not eligible — use individual pricing instead
  if (memberCount <= 4) return 170;
  if (memberCount === 5) return 200;
  if (memberCount === 6) return 230;
  return 230 + 35 * (memberCount - 6); // 7+: $230 base + $35 per additional person
}

// ---------- Optional gear add-ons ----------

export interface GearOption {
  id: string;
  label: string;
  price: number;
}

export const GI_SIZES: GearOption[] = [
  { id: "gi_0000_0", label: "Size 0000 to 0", price: 60 },
  { id: "gi_1_2", label: "Size 1 to 2", price: 65 },
  { id: "gi_3_4", label: "Size 3 to 4", price: 75 },
  { id: "gi_5_7", label: "Size 5 to 7", price: 85 },
];

export const DUMMY_SIZES: GearOption[] = [
  { id: "dummy_4", label: "4 ft", price: 50 },
  { id: "dummy_5", label: "5 ft", price: 60 },
  { id: "dummy_6", label: "6 ft", price: 70 },
];

export const DUFFLE_SIZES: GearOption[] = [
  { id: "duffle_s", label: "Small", price: 65 },
  { id: "duffle_l", label: "Large", price: 75 },
];

// MOCKUP PRICING — update once the club gives real t-shirt/sweatshirt
// prices. Placeholder numbers only, flagged so they're easy to find later.
// Larger sizes cost a bit more, same as real bulk apparel pricing usually works.
export const TSHIRT_SIZES: GearOption[] = [
  { id: "tshirt_ys", label: "Youth Small", price: 15 },
  { id: "tshirt_ym", label: "Youth Medium", price: 15 },
  { id: "tshirt_yl", label: "Youth Large", price: 16 },
  { id: "tshirt_as", label: "Adult Small", price: 18 },
  { id: "tshirt_am", label: "Adult Medium", price: 18 },
  { id: "tshirt_al", label: "Adult Large", price: 19 },
  { id: "tshirt_axl", label: "Adult XL", price: 20 },
  { id: "tshirt_axxl", label: "Adult XXL", price: 22 },
];

export const SWEATSHIRT_SIZES: GearOption[] = [
  { id: "sweat_ys", label: "Youth Small", price: 25 },
  { id: "sweat_ym", label: "Youth Medium", price: 25 },
  { id: "sweat_yl", label: "Youth Large", price: 26 },
  { id: "sweat_as", label: "Adult Small", price: 28 },
  { id: "sweat_am", label: "Adult Medium", price: 28 },
  { id: "sweat_al", label: "Adult Large", price: 29 },
  { id: "sweat_axl", label: "Adult XL", price: 30 },
  { id: "sweat_axxl", label: "Adult XXL", price: 32 },
];
