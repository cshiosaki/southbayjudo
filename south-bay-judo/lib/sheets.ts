import { google } from "googleapis";

/**
 * Uses a single Google Sheet (living in your Drive) as the roster
 * "database" — one row per student per session registered. Columns match
 * the HEADERS array below; the header row is written automatically the
 * first time anyone registers, if it isn't there yet.
 *
 * Setup (see README for full click-by-click steps):
 *   1. Create a Google Sheet, e.g. "South Bay Judo Registrations".
 *   2. In Google Cloud Console, create a service account, enable the
 *      Sheets API, and download the service account's JSON key.
 *   3. Share the Sheet with the service account's email address
 *      (looks like xxx@xxx.iam.gserviceaccount.com) as an Editor.
 *   4. Set env vars: GOOGLE_SERVICE_ACCOUNT_KEY (the JSON key, as one
 *      line) and GOOGLE_SHEET_ID (from the Sheet's URL).
 *
 * NOTE on simplification: family-level extras (family USJF membership
 * plan, practice dummy / duffle bag orders) apply once per registration
 * batch, not per student — they're recorded as a single note in the
 * "Family Extras Note" column of the FIRST student's row in that batch,
 * rather than as fully separate line items. Fine for a club this size;
 * worth revisiting if that ever needs to be queried/reported on its own.
 */

const HEADERS = [
  "Timestamp",
  "Session ID",
  "Session Label",
  "Class Time",
  "New Student",
  "Late/Transfer",
  "First Name",
  "Last Name",
  "DOB",
  "Belt Rank",
  "Guardian First",
  "Guardian Last",
  "Guardian Email",
  "Guardian Phone",
  "Guardian 2 First",
  "Guardian 2 Last",
  "Guardian 2 Email",
  "Guardian 2 Phone",
  "Emergency Contact",
  "Emergency Phone",
  "Has Medical Conditions",
  "Medical Notes",
  "Membership Status",
  "Membership Org",
  "Membership ID#",
  "Membership Expires",
  "Gi Size",
  "Photo Consent",
  "Signed By",
  "Auto-Renew",
  "Session Fee Charged",
  "Paid",
  "Family Extras Note",
  "Receipt Number",
  "Payment Status",
  "Stripe Checkout Session ID",
  "Receipt JSON",
];
const LAST_COLUMN = "AK"; // matches HEADERS.length (37 columns, A..AK)
const PAID_COLUMN = "AF"; // index 31 (0-based) — must match "Paid"'s position in HEADERS
const PAYMENT_STATUS_COLUMN = "AI";

function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return null;
  try {
    const key = JSON.parse(keyJson);
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  } catch {
    return null;
  }
}

function getSheetId() {
  return process.env.GOOGLE_SHEET_ID || null;
}

export function sheetsConfigured() {
  return !!getAuth() && !!getSheetId();
}

async function getSheetsClient() {
  const auth = getAuth();
  if (!auth) return null;
  return google.sheets({ version: "v4", auth });
}

async function ensureHeaders() {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();
  if (!sheets || !sheetId) return;

  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `A1:${LAST_COLUMN}1` });
  const currentHeaders = res.data.values?.[0] || [];
  if (HEADERS.some((header, index) => currentHeaders[index] !== header)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `A1:${LAST_COLUMN}1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

export async function appendRegistration(row: string[]) {
  return appendRegistrations([row]);
}

export async function appendRegistrations(rows: string[][]) {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();
  if (!sheets || !sheetId) throw new Error("Google Sheets isn't connected yet.");
  await ensureHeaders();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}

export interface RosterRow {
  rowNumber: number; // the Sheet's actual row — needed to target updates like marking paid
  timestamp: string;
  sessionId: string;
  sessionLabel: string;
  classTime: string;
  isNewStudent: boolean;
  isLateOrTransfer: boolean;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  beltRank: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardian2FirstName: string;
  guardian2LastName: string;
  guardian2Email: string;
  guardian2Phone: string;
  emergencyContact: string;
  emergencyPhone: string;
  hasMedicalConditions: string;
  medicalNotes: string;
  membershipStatus: string;
  membershipOrg: string;
  membershipIdNumber: string;
  membershipExpires: string;
  giSize: string;
  photoConsent: string;
  signedByName: string;
  autoRenew: boolean;
  sessionFeeCharged: string;
  paid: boolean;
  familyExtrasNote: string;
}

export async function readRoster(sessionId?: string): Promise<RosterRow[]> {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();
  if (!sheets || !sheetId) throw new Error("Google Sheets isn't connected yet.");

  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `A2:${LAST_COLUMN}` });
  const values = res.data.values || [];

  const rows: RosterRow[] = values.map((v, i) => ({
    rowNumber: i + 2, // +2 to account for the header row and 1-indexing
    timestamp: v[0] || "",
    sessionId: v[1] || "",
    sessionLabel: v[2] || "",
    classTime: v[3] || "",
    isNewStudent: v[4] === "TRUE",
    isLateOrTransfer: v[5] === "TRUE",
    firstName: v[6] || "",
    lastName: v[7] || "",
    dateOfBirth: v[8] || "",
    beltRank: v[9] || "",
    guardianFirstName: v[10] || "",
    guardianLastName: v[11] || "",
    guardianEmail: v[12] || "",
    guardianPhone: v[13] || "",
    guardian2FirstName: v[14] || "",
    guardian2LastName: v[15] || "",
    guardian2Email: v[16] || "",
    guardian2Phone: v[17] || "",
    emergencyContact: v[18] || "",
    emergencyPhone: v[19] || "",
    hasMedicalConditions: v[20] || "",
    medicalNotes: v[21] || "",
    membershipStatus: v[22] || "",
    membershipOrg: v[23] || "",
    membershipIdNumber: v[24] || "",
    membershipExpires: v[25] || "",
    giSize: v[26] || "",
    photoConsent: v[27] || "",
    signedByName: v[28] || "",
    autoRenew: v[29] === "TRUE",
    sessionFeeCharged: v[30] || "",
    paid: v[31] === "TRUE",
    familyExtrasNote: v[32] || "",
  }));

  return sessionId ? rows.filter((r) => r.sessionId === sessionId) : rows;
}

export async function setPaid(rowNumber: number, paid: boolean) {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();
  if (!sheets || !sheetId) throw new Error("Google Sheets isn't connected yet.");
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${PAID_COLUMN}${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [[paid ? "TRUE" : "FALSE"]] },
  });
}

export interface StoredRegistrationOrder {
  guardianName: string;
  recipients: string[];
  receipt: {
    receiptNumber: string;
    registeredAt: string;
    paymentStatus: "Payment pending" | "Payment processing" | "Payment failed" | "Paid";
    students: Array<{
      name: string;
      session: string;
      classTime: string;
      sessionFee: number;
      giLabel?: string;
      giPrice?: number;
      membershipStatus: string;
    }>;
    gearItems: Array<{ label: string; price: number }>;
    total: number;
  };
}

/**
 * Updates every roster row that belongs to one checkout. Returns the stored
 * order payload so the Stripe webhook can send the paid receipt exactly once.
 */
export async function updateRegistrationPayment(
  receiptNumber: string,
  paymentStatus: StoredRegistrationOrder["receipt"]["paymentStatus"],
  paid: boolean
) {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();
  if (!sheets || !sheetId) throw new Error("Google Sheets isn't connected yet.");

  await ensureHeaders();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `A2:${LAST_COLUMN}`,
  });
  const values = res.data.values || [];
  const matchingRows = values
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => row[33] === receiptNumber);

  if (matchingRows.length === 0) {
    throw new Error(`Registration ${receiptNumber} was not found.`);
  }

  const wasAlreadyPaid = matchingRows.every(({ row }) => row[31] === "TRUE");
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: matchingRows.flatMap(({ rowNumber }) => [
        { range: `${PAID_COLUMN}${rowNumber}`, values: [[paid ? "TRUE" : "FALSE"]] },
        { range: `${PAYMENT_STATUS_COLUMN}${rowNumber}`, values: [[paymentStatus]] },
      ]),
    },
  });

  const storedJson = matchingRows[0].row[36];
  if (!storedJson) throw new Error(`Registration ${receiptNumber} is missing its receipt data.`);
  const order = JSON.parse(storedJson) as StoredRegistrationOrder;
  order.receipt.paymentStatus = paymentStatus;

  return { order, wasAlreadyPaid };
}
