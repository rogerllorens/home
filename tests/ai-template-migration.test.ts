import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const sql = readFileSync("supabase/sql/020_ai_template_studio.sql", "utf8");
test("AI Template Studio migration creates core tables and RLS", () => {
  for (const table of ["ai_prompt_templates", "ai_prompt_versions", "ai_sector_rules", "ai_model_configs", "ai_routing_rules", "ai_generation_runs", "ai_prompt_experiments"]) assert.ok(sql.includes(`create table if not exists public.${table}`), table);
  assert.ok(sql.includes("enable row level security"));
  assert.ok(sql.includes("Users read own ai generation runs"));
});
