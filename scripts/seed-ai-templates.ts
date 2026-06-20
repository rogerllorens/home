import { createServiceClient } from "../lib/supabase/admin";
import { buildDefaultSystemPrompt, buildDefaultUserPromptTemplate, defaultModelConfigs, defaultPromptKinds, defaultSectorRules, promptSafetyRules } from "../lib/ai-template-studio/defaults";

const dryRun = process.argv.includes("--dry-run");
const now = new Date().toISOString();

async function main() {
  const summary = { templates: defaultPromptKinds.length, sectorRules: defaultSectorRules.length, modelConfigs: defaultModelConfigs.length, routingRules: 8, dryRun };
  if (dryRun || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) { console.log(JSON.stringify({ skippedDb: true, ...summary }, null, 2)); return; }
  const supabase = createServiceClient();
  for (const item of defaultPromptKinds) {
    const template = await supabase.from("ai_prompt_templates").upsert({ key: item.key, name: item.name, type: item.type, status: "active", default_locale: "es", default_sector: "generic_ecommerce", updated_at: now }, { onConflict: "key" }).select("id").single<{ id: string }>();
    if (template.error) throw template.error;
    const version = await supabase.from("ai_prompt_versions").upsert({ template_id: template.data.id, version_number: 1, status: "active", system_prompt: buildDefaultSystemPrompt(item.type), user_prompt_template: buildDefaultUserPromptTemplate(), output_schema: { type: "object", required: ["quality_warnings", "confidence_score"] }, variables_schema: { required: ["input_json", "sector", "language"] }, safety_policy: { rules: promptSafetyRules }, changelog: "Seed inicial Prompt 6" }, { onConflict: "template_id,version_number" }).select("id").single<{ id: string }>();
    if (version.error) throw version.error;
    await supabase.from("ai_prompt_templates").update({ active_version_id: version.data.id }).eq("id", template.data.id);
  }
  for (const rule of defaultSectorRules) await supabase.from("ai_sector_rules").upsert(rule, { onConflict: "key" });
  for (const model of defaultModelConfigs) await supabase.from("ai_model_configs").upsert(model, { onConflict: "provider,model" });
  const routing = [
    ["preview", "template_fallback", "rankelia-template"], ["product_generation", "template_fallback", "rankelia-template"], ["category_generation", "template_fallback", "rankelia-template"], ["metadata_generation", "template_fallback", "rankelia-template"], ["field_regeneration", "template_fallback", "rankelia-template"], ["repair_json", "template_fallback", "rankelia-template"], ["free_audit_summary", "template_fallback", "rankelia-template"], ["gsc_opportunity_summary", "template_fallback", "rankelia-template"]
  ];
  for (const [task_type, primary_provider, primary_model] of routing) await supabase.from("ai_routing_rules").upsert({ task_type, primary_provider, primary_model, fallback_provider: "template_fallback", fallback_model: "rankelia-template", status: "active" });
  console.log(JSON.stringify({ ...summary, seeded: true }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
