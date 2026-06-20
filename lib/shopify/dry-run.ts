import type { SupabaseClient } from "@supabase/supabase-js";
import { getShopifyFieldPolicy } from "./field-policy";

type ChangeSetRow = { id: string; user_id: string; store_id: string; status: string };
type ChangeSetItemRow = { id: string; field_path: string | null; before_value: unknown; proposed_value: unknown; external_product_gid: string | null };
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export async function runShopifyChangeSetDryRun(client: SupabaseClient, args: { userId: string; changeSetId: string }) {
  const { data: changeSet } = await client.from("change_sets").select("id,user_id,store_id,status").eq("id", args.changeSetId).eq("user_id", args.userId).maybeSingle<ChangeSetRow>();
  if (!changeSet) throw new Error("change_set_not_found");
  const { data: items } = await client.from("change_set_items").select("id,field_path,before_value,proposed_value,external_product_gid").eq("change_set_id", changeSet.id).eq("user_id", args.userId).returns<ChangeSetItemRow[]>();
  const dryRunInsert = await client.from("shopify_dry_runs").insert({ user_id: args.userId, store_id: changeSet.store_id, change_set_id: changeSet.id, status: "running", started_at: new Date().toISOString(), items_total: items?.length ?? 0 }).select("id").single();
  if (dryRunInsert.error || !dryRunInsert.data) throw new Error(dryRunInsert.error?.message ?? "dry_run_create_failed");

  let ready = 0;
  let blocked = 0;
  let conflicts = 0;
  const warnings: string[] = [];
  const blockers: string[] = [];
  for (const item of items ?? []) {
    const policy = getShopifyFieldPolicy(item.field_path ?? "");
    let status = "ready";
    let conflictStatus = "none";
    let lastError: string | null = null;
    if (policy.kind === "forbidden" || policy.kind === "unknown") { status = "blocked"; lastError = policy.message; blockers.push(policy.message); }
    else if (policy.kind === "dangerous") { status = "blocked"; lastError = "Campo sensible requiere confirmación extra; no se aplica por defecto."; blockers.push(lastError); }
    else if (!item.external_product_gid) { status = "blocked"; lastError = "Producto Shopify no vinculado."; blockers.push(lastError); }
    else if (item.proposed_value === null || item.proposed_value === undefined || item.proposed_value === "") { status = "blocked"; lastError = "Valor propuesto vacío."; blockers.push(lastError); }
    else if (!same(item.before_value, item.before_value)) { status = "conflict"; conflictStatus = "changed_since_sync"; conflicts += 1; }
    if (status === "ready") ready += 1;
    if (status === "blocked") blocked += 1;
    await client.from("change_set_items").update({ dry_run_status: status, conflict_status: conflictStatus, current_value_at_dry_run: item.before_value, last_error: lastError, status: status === "ready" ? "ready" : "blocked" }).eq("id", item.id).eq("user_id", args.userId);
  }
  const finalStatus = blocked || conflicts ? "completed" : "completed";
  await client.from("shopify_dry_runs").update({ status: finalStatus, items_ready: ready, items_blocked: blocked, conflicts, warnings, blockers, finished_at: new Date().toISOString() }).eq("id", dryRunInsert.data.id).eq("user_id", args.userId);
  await client.from("change_sets").update({ dry_run_id: dryRunInsert.data.id, status: blocked || conflicts ? "blocked" : "dry_run_completed", items_ready: ready, blocked_count: blocked, conflict_count: conflicts }).eq("id", changeSet.id).eq("user_id", args.userId);
  return { dryRunId: dryRunInsert.data.id, itemsReady: ready, itemsBlocked: blocked, conflicts, warnings, blockers };
}
