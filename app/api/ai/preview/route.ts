import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { generateOutputWithAI } from "@/lib/ai";
import type { CsvRow } from "@/lib/csv";
import type { AIProcessingSettings } from "@/lib/ai";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { createGenerationRun } from "@/lib/ai-template-studio/repository";
import { stableHash } from "@/lib/ai-template-studio/renderer";
import { getPlanLimits, isGenerationTypeAllowed, isQualityAllowed } from "@/lib/plan-limits";
import { normalizeGenerationType, normalizeQualityLevel } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "ai:preview", context.user.id, 20, 60);
  if (limited) return limited;
  const body = await request.json().catch(() => null) as { rows?: CsvRow[]; settings?: AIProcessingSettings } | null;
  const supabase = createServiceClient();
  const subscription = await supabase.from("subscriptions").select("plan_id").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle<{ plan_id: string }>();
  const planId = subscription.data?.plan_id ?? "free";
  const planLimits = getPlanLimits(planId);
  const today = new Date().toISOString().slice(0, 10);
  const atomicUsage = await supabase.rpc("increment_preview_usage", { p_user_id: context.user.id, p_usage_date: today, p_limit: planLimits.previewsPerDay }).maybeSingle<{ allowed: boolean; used_count: number; max_allowed: number }>();
  let usedToday = atomicUsage.data?.used_count ?? 0;
  if (atomicUsage.error) {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const usage = await supabase.from("audit_events").select("id", { count: "exact", head: true }).eq("user_id", context.user.id).eq("action", "ai_preview").gte("created_at", since.toISOString());
    usedToday = (usage.count ?? 0) + 1;
    if ((usage.count ?? 0) >= planLimits.previewsPerDay) return NextResponse.json({ error: `Has alcanzado el límite diario de previews de tu plan (${planLimits.previewsPerDay}).` }, { status: 429 });
  } else if (!atomicUsage.data?.allowed) {
    return NextResponse.json({ error: `Has alcanzado el límite diario de previews de tu plan (${planLimits.previewsPerDay}).` }, { status: 429 });
  }

  const generationType = normalizeGenerationType(String(body?.settings?.generation_type ?? body?.settings?.generationType ?? "product_complete"));
  const qualityLevel = normalizeQualityLevel(String(body?.settings?.quality_level ?? body?.settings?.quality ?? "standard"));
  if (!isQualityAllowed(planId, qualityLevel)) return NextResponse.json({ error: `Tu plan actual no permite preview con calidad ${qualityLevel}.` }, { status: 403 });
  if (!isGenerationTypeAllowed(planId, generationType)) return NextResponse.json({ error: "Tu plan actual no permite preview para este tipo de generación." }, { status: 403 });

  const maxRows = Number(process.env.AI_PREVIEW_MAX_ROWS ?? 5);
  const rows = (body?.rows ?? []).slice(0, maxRows);
  if (!rows.length) return NextResponse.json({ error: "No preview rows supplied" }, { status: 400 });
  const settings: AIProcessingSettings = { ...(body?.settings ?? {}), generation_type: generationType, quality_level: qualityLevel, generation_engine: "ai" };
  const results = await Promise.all(rows.map((row, index) => generateOutputWithAI(row, settings).then((result) => ({ index, ...result }))));
  await Promise.all(results.map((result, index) => createGenerationRun({ userId: context.user?.id, taskType: "preview", provider: result.provider, model: result.model, promptVersionLabel: result.promptVersion, inputTokens: result.inputTokens, outputTokens: result.outputTokens, estimatedCost: result.cost, status: result.fallbackUsed ? "fallback" : "completed", fallbackUsed: result.fallbackUsed, warnings: result.validationErrors, promptInputHash: stableHash(rows[index]), outputHash: stableHash(result.rawAIOutput) })));
  await supabase.from("audit_events").insert({ user_id: context.user.id, action: "ai_preview", entity_type: "preview", status: "ok", metadata: { plan_id: planId, rows: rows.length, provider: results[0]?.provider ?? "template", model: results[0]?.model ?? "template" } });
  return NextResponse.json({ results, maxRows, previewsRemainingToday: Math.max(planLimits.previewsPerDay - usedToday, 0), provider: results[0]?.provider ?? "template", model: results[0]?.model ?? "template" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI preview failed" }, { status: 500 });
  }
}
