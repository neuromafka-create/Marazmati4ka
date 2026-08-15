import { NextResponse } from "next/server";
import { clearHubrisKey, publicSettings, saveSettings } from "@/lib/settings";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(publicSettings());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.clearKey) {
    return NextResponse.json(clearHubrisKey());
  }
  const key = typeof body.apiKey === "string" ? body.apiKey : undefined;
  if (key && !key.startsWith("sk-gw-")) {
    return NextResponse.json({ error: "Ключ Hubris начинается с sk-gw-" }, { status: 400 });
  }
  const next = saveSettings({
    hubrisApiKey: key,
    hubrisBaseUrl: typeof body.baseUrl === "string" ? body.baseUrl : undefined,
    hubrisChatModel: typeof body.chatModel === "string" ? body.chatModel : undefined,
    hubrisImageModel: typeof body.imageModel === "string" ? body.imageModel : undefined,
  });
  return NextResponse.json(next);
}
