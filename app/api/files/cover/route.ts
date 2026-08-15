import { NextResponse } from "next/server";
import { setCover } from "@/lib/files";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    setCover(Number(body.noteId), Number(body.fileId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ошибка" }, { status: 400 });
  }
}
