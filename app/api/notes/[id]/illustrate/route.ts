import { NextResponse } from "next/server";
import { attachGeneratedImage, generateIllustration, type ImageRef } from "@/lib/hubris";
import { ALLOWED, MAX_BYTES, absoluteFilePath, getFileRow, sniffMime, type FileRole } from "@/lib/files";
import { getNote, getNoteFiles } from "@/lib/notes";
import fs from "node:fs";

export const runtime = "nodejs";
export const maxDuration = 120;

const ROLES = new Set(["cover", "result", "reference", "inline", "attachment"]);
const MAX_REFS = 8;
const MAX_REF_BYTES = 8 * 1024 * 1024;

type Ctx = { params: Promise<{ id: string }> };

function bufferToRef(buffer: Buffer, fallbackMime: string): ImageRef {
  const mime = sniffMime(buffer, fallbackMime);
  if (!ALLOWED[mime]) throw new Error("Референс: только jpeg, png, webp или gif");
  if (buffer.length > MAX_REF_BYTES) throw new Error("Референс больше 8 МБ — сожмите картинку");
  if (buffer.length > MAX_BYTES) throw new Error("Файл слишком большой");
  return { mime, buffer };
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const noteId = Number(id);
  const note = getNote(noteId);
  if (!note || !note.active) {
    return NextResponse.json({ error: "Заметка не найдена" }, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Нужна форма с промптом" }, { status: 400 });
  }

  const prompt =
    String(form.get("prompt") || "").trim() ||
    [note.title, note.snippet || note.body.slice(0, 400)].filter(Boolean).join("\n\n");
  if (!prompt.trim()) {
    return NextResponse.json({ error: "Напишите, что нарисовать" }, { status: 400 });
  }
  const role = (ROLES.has(String(form.get("role") || "")) ? String(form.get("role")) : "result") as FileRole;

  const refs: ImageRef[] = [];
  try {
    const attached = getNoteFiles(noteId);
    const allowedIds = new Set(attached.map((f) => f.file_id));
    for (const raw of String(form.get("refIds") || "").split(",")) {
      const fileId = Number(raw.trim());
      if (!fileId || !allowedIds.has(fileId)) continue;
      const row = getFileRow(fileId);
      if (!row) continue;
      const abs = absoluteFilePath(row.path);
      if (!fs.existsSync(abs)) continue;
      refs.push(bufferToRef(fs.readFileSync(abs), row.mime));
    }
    for (const item of form.getAll("refs")) {
      if (!(item instanceof File)) continue;
      const buffer = Buffer.from(await item.arrayBuffer());
      refs.push(bufferToRef(buffer, item.type || ""));
    }
    if (refs.length > MAX_REFS) {
      return NextResponse.json({ error: `Можно не больше ${MAX_REFS} референсов` }, { status: 400 });
    }

    const image = await generateIllustration(prompt, refs);
    const saved = attachGeneratedImage({
      noteId,
      buffer: image.buffer,
      mime: image.mime,
      role,
      name: "illustration.png",
    });
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Не сгенерировалось" }, { status: 400 });
  }
}
