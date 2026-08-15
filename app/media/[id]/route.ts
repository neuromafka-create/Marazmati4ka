import fs from "node:fs";
import { NextResponse } from "next/server";
import { absoluteFilePath, getFileRow } from "@/lib/files";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = getFileRow(Number(id));
  if (!row) return new NextResponse("Not found", { status: 404 });
  const abs = absoluteFilePath(row.path);
  if (!fs.existsSync(abs)) return new NextResponse("Missing file", { status: 404 });
  const buf = fs.readFileSync(abs);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": row.mime || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
