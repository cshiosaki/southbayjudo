import { google } from "googleapis";

/**
 * Searches a separate Google Sheet holding the club's known USJF members
 * (name, ID, expiration) so the registration form can look someone up by
 * name instead of asking them to type their membership number blind.
 *
 * This is a DIFFERENT sheet from the registrations roster in lib/sheets.ts
 * — it's a reference list, not something the app writes to. The columns
 * match South Bay Judo's actual USJF export exactly (Name, Expires, ID,
 * Verified Dan Rank, DOB, YDK, Dojo, Type, Auto-Renews), so you can upload
 * that export file straight into a Google Sheet with no reformatting —
 * see README for the exact steps.
 *
 * Reuses the same service account as the roster (GOOGLE_SERVICE_ACCOUNT_KEY)
 * — just needs its own sheet ID: GOOGLE_USJF_SHEET_ID.
 */

export interface UsjfMember {
  name: string; // "Last, First Middle" — matches the export's format
  expires: string; // ISO-ish date string, e.g. "2027-07-09"
  id: string;
  dob: string;
}

function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return null;
  try {
    const key = JSON.parse(keyJson);
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  } catch {
    return null;
  }
}

function getSheetId() {
  return process.env.GOOGLE_USJF_SHEET_ID || null;
}

export function usjfLookupConfigured() {
  return !!getAuth() && !!getSheetId();
}

// Cache the sheet in memory for a few minutes — it's read on every keystroke
// of the search box, and this data changes rarely (only when a membership
// export is re-uploaded), so there's no need to hit the Sheets API that often.
let cache: { data: UsjfMember[]; fetchedAt: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

async function loadAll(): Promise<UsjfMember[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.data;

  const auth = getAuth();
  const sheetId = getSheetId();
  if (!auth || !sheetId) throw new Error("USJF lookup sheet isn't connected yet.");

  const sheets = google.sheets({ version: "v4", auth });
  // Columns per the real export: Name, Expires, ID, Verified Dan Rank, DOB, YDK, Dojo, Type, Auto-Renews
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "A2:E" });
  const values = res.data.values || [];

  const data: UsjfMember[] = values
    .filter((v) => v[0]) // skip blank rows
    .map((v) => ({ name: v[0] || "", expires: v[1] || "", id: v[2] || "", dob: v[4] || "" }));

  cache = { data, fetchedAt: Date.now() };
  return data;
}

export async function searchMembers(query: string): Promise<UsjfMember[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const all = await loadAll();
  return all.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 8);
}

export function isExpired(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}
