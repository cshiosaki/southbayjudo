import { getDriveClient } from "@/lib/sponsors";

export const revalidate = 600;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const drive = await getDriveClient();
  if (!drive) {
    return new Response("Google Drive is not configured", { status: 503 });
  }

  try {
    const metadata = await drive.files.get({
      fileId: params.id,
      fields: "mimeType,name",
      supportsAllDrives: true,
    });

    const file = await drive.files.get(
      {
        fileId: params.id,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "arraybuffer" }
    );

    return new Response(file.data as ArrayBuffer, {
      headers: {
        "Content-Type": metadata.data.mimeType || "image/png",
        "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Unable to load sponsor logo", error);
    return new Response("Sponsor logo not found", { status: 404 });
  }
}
