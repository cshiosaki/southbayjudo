import { NextRequest, NextResponse } from "next/server";

/**
 * Body: { password: string, action: "verify" | "save", config?: SiteConfig }
 *
 * "verify" just checks the password (used by the admin page's unlock
 * screen, before it loads the current config into the form).
 * "save" checks the password AND writes the given config to Global Config.
 *
 * Requires these env vars (set in Vercel Project Settings → Environment
 * Variables — see README for how to get each one):
 *   ADMIN_PASSWORD          — whatever passcode you want admins to use
 *   GLOBAL_CONFIG_ID        — starts with "ecfg_"
 *   VERCEL_API_TOKEN        — a Vercel personal access token with write
 *                             access, used only server-side, never exposed
 *                             to the browser
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, action, config } = body;

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD isn't set in this deployment's environment variables yet." },
      { status: 500 }
    );
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  if (action === "verify") {
    return NextResponse.json({ ok: true });
  }

  const id = process.env.GLOBAL_CONFIG_ID;
  const apiToken = process.env.VERCEL_API_TOKEN;
  if (!id || !apiToken) {
    return NextResponse.json(
      { error: "Global Config isn't connected yet — see README for setup steps." },
      { status: 500 }
    );
  }

  const res = await fetch(`https://api.vercel.com/v1/global-config/${id}/items`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ operation: "upsert", key: "siteConfig", value: config }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
