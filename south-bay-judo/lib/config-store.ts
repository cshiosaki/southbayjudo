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
export async function getSiteConfig(): Promise<SiteConfig> {
  const id = process.env.GLOBAL_CONFIG_ID;
  const token = process.env.GLOBAL_CONFIG_READ_TOKEN;
  if (!id || !token) return DEFAULTS;

  try {
    const res = await fetch(`https://global-config.vercel.com/${id}/items?token=${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return DEFAULTS;
    const items = await res.json();
    const value = items?.siteConfig;
    if (!value || !Array.isArray(value.sessions)) return DEFAULTS;
    return value as SiteConfig;
  } catch {
    return DEFAULTS;
  }
}
