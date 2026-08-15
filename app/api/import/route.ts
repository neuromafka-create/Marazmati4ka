import { NextResponse } from "next/server";
import { importDocs } from "@/lib/import-docs";

export const runtime = "nodejs";

export function POST() {
  const result = importDocs();
  return NextResponse.json(result);
}

export function GET() {
  const result = importDocs();
  return NextResponse.json(result);
}
