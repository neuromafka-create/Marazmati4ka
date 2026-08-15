import { NextResponse } from "next/server";
import { createTaxon, listTaxons, seedTaxons, type TaxonKind } from "@/lib/taxonomy";

export const runtime = "nodejs";

export function GET() {
  seedTaxons();
  return NextResponse.json({
    types: listTaxons("type"),
    domains: listTaxons("domain"),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    seedTaxons();
    const taxon = createTaxon({
      kind: body.kind as TaxonKind,
      label: String(body.label || ""),
      slug: body.slug ? String(body.slug) : undefined,
    });
    return NextResponse.json({ taxon });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ошибка" }, { status: 400 });
  }
}
