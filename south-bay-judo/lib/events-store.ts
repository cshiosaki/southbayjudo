export interface EventDocument {
  title: string;
  url: string;
  downloadUrl?: string;
  pathname: string;
  uploadedAt: string;
}

export async function getEventDocument(): Promise<EventDocument | null> {
  const id = process.env.GLOBAL_CONFIG_ID;
  const token = process.env.GLOBAL_CONFIG_READ_TOKEN;
  if (!id || !token) return null;

  try {
    const res = await fetch(`https://global-config.vercel.com/${id}/items?token=${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const items = await res.json();
    const value = items?.eventDocument;
    if (!value?.url || !value?.pathname) return null;
    return value as EventDocument;
  } catch {
    return null;
  }
}

export async function saveEventDocument(document: EventDocument): Promise<void> {
  const id = process.env.GLOBAL_CONFIG_ID;
  const apiToken = process.env.VERCEL_API_TOKEN;
  if (!id || !apiToken) throw new Error("Site storage is not configured.");

  const res = await fetch(`https://api.vercel.com/v1/global-config/${id}/items`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ operation: "upsert", key: "eventDocument", value: document }],
    }),
  });

  if (!res.ok) throw new Error("The PDF uploaded, but the Events page could not be updated.");
}
