export type SponsorTier = "Platinum" | "Gold" | "Silver" | "Bronze";

export type Sponsor = {
  id: string;
  name: string;
  tier: SponsorTier;
  logo: string;
  driveUrl: string;
};

const ROOT_FOLDER_ID =
  process.env.SPONSOR_DRIVE_FOLDER_ID || "1oM_tcScpP-RyfKBUVuVxte91mMCCyAJg";

const TIER_NAMES: SponsorTier[] = ["Platinum", "Gold", "Silver", "Bronze"];

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
};

type DriveListResponse = {
  files?: DriveFile[];
  nextPageToken?: string;
};

function sponsorNameFromFile(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/^\s*\d+\s*[-_.]\s*/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function listDriveChildren(parentId: string): Promise<DriveFile[]> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) return [];

  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      key: apiKey,
      q: `'${parentId}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,webViewLink)",
      pageSize: "1000",
      orderBy: "name",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      { next: { revalidate: 600 } }
    );

    if (!response.ok) {
      console.error("Unable to load sponsor files from Google Drive", response.status);
      return [];
    }

    const data = (await response.json()) as DriveListResponse;
    files.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

export async function getSponsors(): Promise<Sponsor[]> {
  try {
    const rootItems = await listDriveChildren(ROOT_FOLDER_ID);
    const folders = rootItems.filter(
      (item) => item.mimeType === "application/vnd.google-apps.folder"
    );

    const sponsorsByTier = await Promise.all(
      TIER_NAMES.map(async (tier) => {
        const folder = folders.find(
          (item) => item.name.trim().toLowerCase() === tier.toLowerCase()
        );
        if (!folder) return [];

        const files = await listDriveChildren(folder.id);

        return files
          .filter((file) => file.mimeType.startsWith("image/"))
          .map((file): Sponsor => ({
            id: file.id,
            name: sponsorNameFromFile(file.name),
            tier,
            logo: `https://drive.google.com/uc?export=view&id=${file.id}`,
            driveUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
          }));
      })
    );

    return sponsorsByTier.flat();
  } catch (error) {
    console.error("Unable to load sponsors from Google Drive", error);
    return [];
  }
}
