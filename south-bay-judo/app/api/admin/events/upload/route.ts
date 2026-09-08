import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getEventDocument, saveEventDocument } from "@/lib/events-store";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new Error("PDF storage is not connected yet.");
        }

        const payload = JSON.parse(clientPayload || "{}") as { password?: string; title?: string };
        if (!process.env.ADMIN_PASSWORD || payload.password !== process.env.ADMIN_PASSWORD) {
          throw new Error("Incorrect admin password.");
        }
        if (!pathname.startsWith("events/") || !pathname.toLowerCase().endsWith(".pdf")) {
          throw new Error("Only event PDF files are allowed.");
        }

        const title = (payload.title || "South Bay Judo Events").trim().slice(0, 100);
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ title }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { title } = JSON.parse(tokenPayload || "{}") as { title?: string };
        const previous = await getEventDocument();

        await saveEventDocument({
          title: title || "South Bay Judo Events",
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          pathname: blob.pathname,
          uploadedAt: new Date().toISOString(),
        });

        if (previous?.url && previous.url !== blob.url) {
          await del(previous.url).catch(() => undefined);
        }
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 }
    );
  }
}
