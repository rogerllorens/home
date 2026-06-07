import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { generateOutputWithAI } from "@/lib/ai";
import type { CsvRow } from "@/lib/csv";
import type { AIProcessingSettings } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { rows?: CsvRow[]; settings?: AIProcessingSettings } | null;
  const maxRows = Number(process.env.AI_PREVIEW_MAX_ROWS ?? 5);
  const rows = (body?.rows ?? []).slice(0, maxRows);
  if (!rows.length) return NextResponse.json({ error: "No preview rows supplied" }, { status: 400 });
  const settings: AIProcessingSettings = { ...(body?.settings ?? {}), generation_engine: "ai" };
  const results = await Promise.all(rows.map((row, index) => generateOutputWithAI(row, settings).then((result) => ({ index, ...result }))));
  return NextResponse.json({ results, maxRows, provider: results[0]?.provider ?? "template", model: results[0]?.model ?? "template" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI preview failed" }, { status: 500 });
  }
}
