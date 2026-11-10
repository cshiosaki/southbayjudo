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
// Keep Holiday 2026 enrollment available through December 1, 2026
// (Pacific time), regardless of older saved admin settings.
function applyHolidayRegistrationWindow(config: SiteConfig): SiteConfig {
  const nowPacific = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const year = Number(nowPacific.slice(0, 4));
  const month = Number(nowPacific.slice(5, 7));
  const day = Number(nowPacific.slice(8, 10));
  const isOpen = year < 2026 || (year === 2026 && (month < 12 || (month === 12 && day <= 1)));
  return {
    ...config,
    sessions: config.sessions.map((session) =>
      session.id === "sess_5q" ? { ...session, registrationOpen: isOpen } : session
    ),
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const id = process.env.GLOBAL_CONFIG_ID;
  const token = process.env.GLOBAL_CONFIG_READ_TOKEN;
  if (!id || !token) return applyHolidayRegistrationWindow(DEFAULTS);

  try {
    const res = await fetch(`https://global-config.vercel.com/${id}/items?token=${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return applyHolidayRegistrationWindow(DEFAULTS);
    const items = await res.json();
    const value = items?.siteConfig;
    if (!value || !Array.isArray(value.sessions)) return applyHolidayRegistrationWindow(DEFAULTS);

    // Keep live edits for sessions that still exist, while allowing newly
    // published sessions to appear and retired sessions to drop away.
    const storedSessions = new Map(
      (value.sessions as SessionConfig[]).map((session) => [session.id, session])
    );
    return applyHolidayRegistrationWindow({
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
        return {
          ...session,
          ...(storedSession || {}),
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
    return applyHolidayRegistrationWindow(DEFAULTS);
  }
}
