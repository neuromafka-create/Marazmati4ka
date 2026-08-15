import { NextResponse } from "next/server";
import { attachFile, type FileRole } from "@/lib/files";

export const runtime = "nodejs";

const ROLES = new Set(["cover", "result", "reference", "inline", "attachment"]);

export async function POST(req: Request) {
  const form = await req.formData();
  const noteId = Number(form.get("noteId"));
  const role = String(form.get("role") || "result") as FileRole;
  const file = form.get("file");
  if (!noteId || !(file instanceof File)) {
    return NextResponse.json({ error: "Нужны noteId и file" }, { status: 400 });
  }
  if (!ROLES.has(role)) {
    return NextResponse.json({ error: "Неверная роль" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const attached = attachFile({
      noteId,
      buffer,
      mime: file.type || "",
      origName: file.name || "paste.png",
      role,
    });
    return NextResponse.json(attached);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ошибка" }, { status: 400 });
  }
}
