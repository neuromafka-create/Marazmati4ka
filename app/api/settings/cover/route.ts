import { NextResponse } from "next/server";
import {
  clearCustomPlaceholderCover,
  customPlaceholderFile,
  saveCustomPlaceholderCover,
} from "@/lib/settings";
import { serveStoredFile } from "@/lib/media-http";

export const runtime = "nodejs";

export function GET(req: Request) {
  const file = customPlaceholderFile();
  if (!file) return new NextResponse("Not found", { status: 404 });
  return serveStoredFile(req, file.abs, file.mime, file.origName);
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Нужен файл картинки" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const next = saveCustomPlaceholderCover(buffer, file.type || "");
    return NextResponse.json(next);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ошибка" }, { status: 400 });
  }
}

export function DELETE() {
  return NextResponse.json(clearCustomPlaceholderCover());
}
