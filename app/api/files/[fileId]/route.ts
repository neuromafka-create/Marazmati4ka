import { NextResponse } from "next/server";
import { detachFile, setFileRole, type FileRole } from "@/lib/files";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ fileId: string }> };

const ROLES = new Set(["cover", "result", "reference", "inline", "attachment"]);

export async function PATCH(req: Request, ctx: Ctx) {
  const { fileId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const noteId = Number(body.noteId);
  const role = String(body.role || "") as FileRole;
  if (!noteId) return NextResponse.json({ error: "Нужен noteId" }, { status: 400 });
  if (!ROLES.has(role)) return NextResponse.json({ error: "Неверная роль" }, { status: 400 });
  try {
    const updated = setFileRole(noteId, Number(fileId), role);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ошибка" }, { status: 400 });
  }
}

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
