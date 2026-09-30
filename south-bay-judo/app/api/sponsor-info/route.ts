import { NextResponse } from "next/server";
import { Readable } from "stream";
import { getDriveClient, type SponsorTier } from "@/lib/sponsors";

export const runtime = "nodejs";

const ROOT_FOLDER_ID =
  process.env.SPONSOR_DRIVE_FOLDER_ID || "1N32pzYliKI7zOpVoB8tl-1D-fzV7DQKV";

const VALID_TIERS: SponsorTier[] = ["Platinum", "Gold", "Silver", "Bronze"];
const VALID_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function safeName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9&()' ._-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function extensionFor(file: File) {
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  return ".jpg";
}

export async function POST(request: Request) {
  const form = await request.formData();

  const tier = String(form.get("tier") || "") as SponsorTier;
  const businessName = safeName(String(form.get("businessName") || ""));
  const contactName = safeName(String(form.get("contactName") || ""));
  const email = String(form.get("email") || "").trim();
  const phone = safeName(String(form.get("phone") || ""));
  const website = String(form.get("website") || "").trim();
  const notes = String(form.get("notes") || "").trim().slice(0, 2000);
  const logo = form.get("logo");

  if (!VALID_TIERS.includes(tier) || !businessName || !contactName || !email) {
    return new Response("Missing required sponsor information.", { status: 400 });
  }

  if (!(logo instanceof File) || !VALID_TYPES.has(logo.type)) {
    return new Response("Please upload a PNG, JPG/JPEG, or WebP logo.", { status: 400 });
  }

  if (logo.size > MAX_FILE_SIZE) {
    return new Response("Logo file is too large. Maximum size is 10 MB.", { status: 400 });
  }

  const drive = await getDriveClient();
  if (!drive) {
    return new Response("Google Drive is not configured.", { status: 503 });
  }

  try {
    const folderSearch = await drive.files.list({
      q: `'${ROOT_FOLDER_ID}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
      fields: "files(id,name)",
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const folder = (folderSearch.data.files || []).find(
      (item) => item.name?.trim().toLowerCase() === tier.toLowerCase()
    );

    if (!folder?.id) {
      return new Response("Sponsor tier folder was not found.", { status: 500 });
    }

    const bytes = Buffer.from(await logo.arrayBuffer());
    const fileName = `${businessName}${extensionFor(logo)}`;

    const created = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folder.id],
        description: [
          `Sponsor tier: ${tier}`,
          `Contact: ${contactName}`,
          `Email: ${email}`,
          phone ? `Phone: ${phone}` : "",
          website ? `Website: ${website}` : "",
          notes ? `Notes: ${notes}` : "",
        ].filter(Boolean).join("\n"),
      },
      media: {
        mimeType: logo.type,
        body: Readable.from(bytes),
      },
      fields: "id,name",
      supportsAllDrives: true,
    });

    if (!created.data.id) {
      return new Response("Logo upload did not complete.", { status: 500 });
    }

    const successUrl = new URL("/sponsor-info", request.url);
    successUrl.searchParams.set("tier", tier.toLowerCase());
    successUrl.searchParams.set("success", "1");

    return NextResponse.redirect(successUrl, 303);
  } catch (error) {
    console.error("Sponsor logo upload failed", error);
    return new Response("We could not upload the sponsor logo. Please contact South Bay Judo.", { status: 500 });
  }
}
