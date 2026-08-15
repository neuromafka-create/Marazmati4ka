import { NextResponse } from "next/server";
import { getNote, getNoteFiles, saveNote, trashNote } from "@/lib/notes";
import { isDomain, isType } from "@/lib/taxonomy";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const note = getNote(Number(id));
  if (!note) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const files = getNoteFiles(note.id);
  return NextResponse.json({ note, files });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const domains = Array.isArray(body.domains)
    ? body.domains.map(String)
    : body.domain
      ? [String(body.domain)]
      : [];
  if (!isType(body.type) || !domains.length || domains.some((d: string) => !isDomain(d))) {
    return NextResponse.json({ error: "Неверный тип или области" }, { status: 400 });
  }
  try {
    const note = saveNote(Number(id), {
      title: String(body.title || ""),
      type: body.type,
      domains,
      body: String(body.body || ""),
      source: body.source ? String(body.source) : null,
    });
    const files = getNoteFiles(note.id);
    return NextResponse.json({ note, files });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ошибка" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    trashNote(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ошибка" }, { status: 400 });
  }
}
