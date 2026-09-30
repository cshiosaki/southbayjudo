import { google } from "googleapis";

export type SponsorTier = "Platinum" | "Gold" | "Silver" | "Bronze";

export type Sponsor = {
  id: string;
  name: string;
  tier: SponsorTier;
  logo: string;
};

const ROOT_FOLDER_ID =
  process.env.SPONSOR_DRIVE_FOLDER_ID || "1N32pzYliKI7zOpVoB8tl-1D-fzV7DQKV";

const TIER_NAMES: SponsorTier[] = ["Platinum", "Gold", "Silver", "Bronze"];

function getDriveAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return null;

  try {
    const key = JSON.parse(keyJson);
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
  } catch (error) {
    console.error("Unable to parse Google service account credentials", error);
    return null;
  }
}

export async function getDriveClient() {
  const auth = getDriveAuth();
  if (!auth) return null;
  return google.drive({ version: "v3", auth });
}

function sponsorNameFromFile(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/^\s*\d+\s*[-_.]\s*/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getSponsors(): Promise<Sponsor[]> {
  const drive = await getDriveClient();
  if (!drive) return [];

  try {
    const root = await drive.files.list({
      q: `'${ROOT_FOLDER_ID}' in parents and trashed = false`,
      fields: "files(id,name,mimeType)",
      pageSize: 100,
      orderBy: "name",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const tierFolders = root.data.files || [];

    const byTier = await Promise.all(
      TIER_NAMES.map(async (tier) => {
        const folder = tierFolders.find(
          (item) =>
            item.mimeType === "application/vnd.google-apps.folder" &&
            item.name?.trim().toLowerCase() === tier.toLowerCase()
        );

        if (!folder?.id) return [];

        const result = await drive.files.list({
          q: `'${folder.id}' in parents and trashed = false`,
          fields: "files(id,name,mimeType)",
          pageSize: 1000,
          orderBy: "name",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        return (result.data.files || [])
          .filter(
            (file) =>
              !!file.id &&
              !!file.name &&
              !!file.mimeType &&
              file.mimeType.startsWith("image/")
          )
          .map(
            (file): Sponsor => ({
              id: file.id!,
              name: sponsorNameFromFile(file.name!),
              tier,
              logo: `/api/sponsor-logo/${file.id}`,
            })
          );
      })
    );

    return byTier.flat();
  } catch (error) {
    console.error("Unable to load sponsor logos from Google Drive", error);
    return [];
  }
}
