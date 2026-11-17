import {
  SESSIONS as DEFAULT_SESSIONS,
  CLASS_TIMES as DEFAULT_CLASS_TIMES,
  MEMBERSHIP_FEE as DEFAULT_MEMBERSHIP_FEE,
  SessionConfig,
  ClassTimeConfig,
} from "./sessions";

export interface SiteConfig {
  sessions: SessionConfig[];
  classTimes: ClassTimeConfig[];
  membershipFee: number;
}

const DEFAULTS: SiteConfig = {
  sessions: DEFAULT_SESSIONS,
  classTimes: DEFAULT_CLASS_TIMES,
  membershipFee: DEFAULT_MEMBERSHIP_FEE,
};

/**
 * Reads the live site config (session dates/prices/class times) from
 * Vercel Global Config, if one is connected. Falls back to the hardcoded
 * defaults in lib/sessions.ts when Global Config isn't set up (local dev,
 * or before GLOBAL_CONFIG_ID / GLOBAL_CONFIG_READ_TOKEN are set) — so the
 * site always renders even before the admin page is configured.
 *
 * The admin page (/admin) writes to the same "siteConfig" key via
 * app/api/admin/config/route.ts.
 */
// Use the club's Pacific calendar dates, with registration start/end inclusive.
// This is enforced through getSiteConfig by both the UI and checkout API.
function applyRegistrationWindows(config: SiteConfig): SiteConfig {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value || "";
  const todayPacific = `${part("year")}-${part("month")}-${part("day")}`;
  return {
    ...config,
    sessions: config.sessions.map((session) => {
      if (session.id === "sess_5q") {
        // Maintain the already approved 2026 Holiday extension through Dec 1.
        return { ...session, registrationOpen: todayPacific <= "2026-12-01" };
      }
      if (session.registrationStart && session.registrationEnd) {
        return {
          ...session,
          registrationOpen: todayPacific >= session.registrationStart && todayPacific <= session.registrationEnd,
        };
      }
      return session;
    }),
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const id = process.env.GLOBAL_CONFIG_ID;
  const token = process.env.GLOBAL_CONFIG_READ_TOKEN;
  if (!id || !token) return applyRegistrationWindows(DEFAULTS);

  try {
    const res = await fetch(`https://global-config.vercel.com/${id}/items?token=${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return applyRegistrationWindows(DEFAULTS);
    const items = await res.json();
    const value = items?.siteConfig;
    if (!value || !Array.isArray(value.sessions)) return applyRegistrationWindows(DEFAULTS);

    // Keep live edits for sessions that still exist, while allowing newly
    // published sessions to appear and retired sessions to drop away.
    const storedSessions = new Map(
      (value.sessions as SessionConfig[]).map((session) => [session.id, session])
    );
    return applyRegistrationWindows({
      sessions: DEFAULT_SESSIONS.filter((session) => session.id !== "sess_4q").map((session) => {
        const storedSession = storedSessions.get(session.id);
        const isHolidaySession = session.id === "sess_5q" || session.id === "sess_2027_5q";
        const hasLegacyFamilyPricing =
          storedSession?.pricingMode === "family_tier" &&
          storedSession.familyTierFirst === 180 &&
          storedSession.familyTierSecond === 160 &&
          storedSession.familyTierThirdPlus === 140;
        const hasLegacyHolidayFlatPricing =
          isHolidaySession &&
          storedSession?.pricingMode === "flat" &&
          storedSession.flatPrice === 120;
        const refresh2027 = session.id.startsWith("sess_2027_") &&
          (!storedSession?.registrationStart || !storedSession?.registrationEnd);
        return {
          ...session,
          ...(storedSession || {}),
          // Upgrade older saved admin sessions with the issued 2027 dates and prices.
          ...(refresh2027 ? session : {}),
          // Holiday sessions use a family-friendly public name even if an
          // older saved admin configuration still contains the former 5Q label.
          ...(isHolidaySession ? { label: session.label, note: session.note } : {}),
          // Migrate the previous 180/160/140 family tiers while preserving
          // any different prices intentionally saved later in Admin.
          ...(hasLegacyFamilyPricing || hasLegacyHolidayFlatPricing
            ? {
                pricingMode: session.pricingMode,
                flatPrice: session.flatPrice,
                familyTierFirst: session.familyTierFirst,
                familyTierSecond: session.familyTierSecond,
                familyTierThirdPlus: session.familyTierThirdPlus,
              }
            : {}),
        };
      }),
      classTimes: Array.isArray(value.classTimes) ? value.classTimes : DEFAULT_CLASS_TIMES,
      membershipFee:
        typeof value.membershipFee === "number" && value.membershipFee !== 70
          ? value.membershipFee
          : DEFAULT_MEMBERSHIP_FEE,
    });
  } catch {
    return applyRegistrationWindows(DEFAULTS);
  }
}
