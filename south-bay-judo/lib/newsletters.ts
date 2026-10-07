import { google } from "googleapis";

const CURRENT_FOLDER_ID = "1EwojE2KomShDWrzSYWHHMYtUp1vyaIJa";
const HISTORY_FOLDER_ID = "12UTntGH4RQmtXr-ifpfVrG0upVngR7Ur";

export interface NewsletterFile {
  id: string;
  name: string;
  title: string;
  modifiedTime: string;
}

function getDriveAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return null;

  try {
    return new google.auth.GoogleAuth({
      credentials: JSON.parse(keyJson),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  } catch {
    return null;
  }
}

function formatTitle(name: string) {
  const year = name.match(/20\d{2}/)?.[0] ?? "";
  if (/jan(?:uary)?\s*to\s*mar(?:ch)?/i.test(name)) {
    return `January–March ${year}`.trim();
  }

  const match = name.match(/\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\b/i);
  if (!match) return name.replace(/\.pdf$/i, "");
  const months: Record<string, string> = {
    jan: "January", january: "January",
    feb: "February", february: "February",
    mar: "March", march: "March",
    apr: "April", april: "April",
    may: "May",
    jun: "June", june: "June",
    jul: "July", july: "July",
    aug: "August", august: "August",
    sep: "September", sept: "September", september: "September",
    oct: "October", october: "October",
    nov: "November", november: "November",
    dec: "December", december: "December",
  };
  return `${months[match[1].toLowerCase()]} ${year}`.trim();
}

export async function getNewsletterFolders() {
  const auth = getDriveAuth();
  if (!auth) return { current: null as NewsletterFile | null, past: [] as NewsletterFile[] };

  try {
    const drive = google.drive({ version: "v3", auth });
    const listFolder = async (folderId: string) => {
      const result = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false and mimeType = 'application/pdf'`,
        pageSize: 100,
        orderBy: "name desc",
        fields: "files(id,name,modifiedTime)",
      });
      return (result.data.files ?? [])
        .filter((file): file is typeof file & { id: string; name: string } => Boolean(file.id && file.name))
        .map((file) => ({
          id: file.id,
          name: file.name,
          title: formatTitle(file.name),
          modifiedTime: file.modifiedTime ?? "",
        }));
    };

    const [currentFiles, past] = await Promise.all([
      listFolder(CURRENT_FOLDER_ID),
      listFolder(HISTORY_FOLDER_ID),
    ]);
    const current = currentFiles.sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime))[0] ?? null;
    past.sort((a, b) => {
      const aNumber = Number(a.name.match(/^\s*(\d+)/)?.[1] ?? 0);
      const bNumber = Number(b.name.match(/^\s*(\d+)/)?.[1] ?? 0);
      return bNumber - aNumber || b.title.localeCompare(a.title);
    });
    return { current, past };
  } catch (error) {
    console.error("Could not read newsletter folders from Google Drive.", error);
    return { current: null as NewsletterFile | null, past: [] as NewsletterFile[] };
  }
}

export async function downloadNewsletterPdf(fileId: string, download: boolean) {
  const auth = getDriveAuth();
  if (!auth) return null;

  try {
    const drive = google.drive({ version: "v3", auth });
    const metadata = await drive.files.get({
      fileId,
      fields: "id,name,mimeType,parents",
    });
    const file = metadata.data;
    const allowedParents = [CURRENT_FOLDER_ID, HISTORY_FOLDER_ID];
    if (
      file.mimeType !== "application/pdf" ||
      !file.name ||
      !(file.parents ?? []).some((parent) => allowedParents.includes(parent))
    ) {
      return null;
    }

    const token = await auth.getAccessToken();
    if (!token) return null;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return {
      bytes,
      name: file.name,
      contentDisposition: `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    };
  } catch (error) {
    console.error("Could not fetch a newsletter PDF from Google Drive.", error);
    return null;
  }
}
