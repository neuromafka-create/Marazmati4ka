import { NextResponse } from "next/server";
import { detachFile } from "@/lib/files";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ fileId: string }> };

export async function DELETE(req: Request, ctx: Ctx) {
  const { fileId } = await ctx.params;
  const noteId = Number(new URL(req.url).searchParams.get("noteId"));
  if (!noteId) return NextResponse.json({ error: "Нужен noteId" }, { status: 400 });
  try {
    detachFile(noteId, Number(fileId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ошибка" }, { status: 400 });
  }
}
