import type { SupabaseClient } from "@supabase/supabase-js";

const APPLY_CONFIRMATION = "APLICAR CAMBIOS";

type StoreRow = { id: string; user_id: string; granted_scopes: string[]; access_token_encrypted?: string | null };
type ChangeSetRow = { id: string; user_id: string; store_id: string; status: string; dry_run_id: string | null; blocked_count: number; conflict_count: number };

type EnqueueApplyArgs = { userId: string; changeSetId: string; confirmation: string; idempotencyKey?: string };

export function assertShopifyApplyEnabled() {
  if (process.env.SHOPIFY_WRITE_ENABLED !== "true") throw new Error("shopify_write_disabled");
}

export async function enqueueShopifyApplyRun(client: SupabaseClient, args: EnqueueApplyArgs) {
  assertShopifyApplyEnabled();
  if (args.confirmation !== APPLY_CONFIRMATION) throw new Error("invalid_apply_confirmation");
  const { data: changeSet } = await client.from("change_sets").select("id,user_id,store_id,status,dry_run_id,blocked_count,conflict_count").eq("id", args.changeSetId).eq("user_id", args.userId).maybeSingle<ChangeSetRow>();
  if (!changeSet) throw new Error("change_set_not_found");
  if (changeSet.status !== "dry_run_completed" && changeSet.status !== "ready_to_apply") throw new Error("dry_run_required");
  if (!changeSet.dry_run_id) throw new Error("dry_run_required");
  if (changeSet.blocked_count || changeSet.conflict_count) throw new Error("change_set_has_blockers");
  const { data: store } = await client.from("shopify_stores").select("id,user_id,granted_scopes,access_token_encrypted").eq("id", changeSet.store_id).eq("user_id", args.userId).maybeSingle<StoreRow>();
  if (!store) throw new Error("shopify_store_not_found");
  if (!store.access_token_encrypted) throw new Error("shopify_token_missing");
  if (!store.granted_scopes?.includes("write_products")) throw new Error("write_products_scope_required");
  if (args.idempotencyKey) {
    const { data: existing } = await client.from("shopify_apply_runs").select("id,status").eq("user_id", args.userId).eq("idempotency_key", args.idempotencyKey).maybeSingle();
    if (existing) return { applyRunId: existing.id, status: existing.status, idempotent: true };
  }
  const { count } = await client.from("change_set_items").select("id", { count: "exact", head: true }).eq("change_set_id", changeSet.id).eq("user_id", args.userId).eq("dry_run_status", "ready");
  const inserted = await client.from("shopify_apply_runs").insert({ user_id: args.userId, store_id: changeSet.store_id, change_set_id: changeSet.id, dry_run_id: changeSet.dry_run_id, status: "queued", confirmed_by: args.userId, confirmed_at: new Date().toISOString(), idempotency_key: args.idempotencyKey ?? null, items_total: count ?? 0 }).select("id,status").single();
  if (inserted.error || !inserted.data) throw new Error(inserted.error?.message ?? "apply_run_create_failed");
  await client.from("change_sets").update({ status: "apply_queued", apply_run_id: inserted.data.id, confirmed_at: new Date().toISOString(), confirmed_by: args.userId }).eq("id", changeSet.id).eq("user_id", args.userId);
  return { applyRunId: inserted.data.id, status: inserted.data.status, idempotent: false };
}

export async function processShopifyApplyRun(client: SupabaseClient, args: { runId: string; dryRun?: boolean; limit?: number }) {
  const { data: run } = await client.from("shopify_apply_runs").select("*").eq("id", args.runId).maybeSingle();
  if (!run) throw new Error("apply_run_not_found");
  const { data: items } = await client.from("change_set_items").select("*").eq("change_set_id", run.change_set_id).eq("user_id", run.user_id).eq("dry_run_status", "ready").limit(args.limit ?? 100);
  if (args.dryRun) return { dryRun: true, wouldApply: items?.length ?? 0 };
  await client.from("shopify_apply_runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", run.id);
  let applied = 0;
  let failed = 0;
  for (const item of items ?? []) {
    const { data: product } = await client.from("shopify_products").select("raw_product").eq("store_id", run.store_id).eq("shopify_product_gid", item.external_product_gid).maybeSingle();
    const snapshot = await client.from("shopify_product_snapshots").insert({ user_id: run.user_id, store_id: run.store_id, shopify_product_gid: item.external_product_gid, snapshot_type: "pre_apply", snapshot: product?.raw_product ?? item.before_snapshot ?? {}, source: "shopify_apply" }).select("id").single();
    const status = snapshot.error ? "failed" : "applied";
    if (status === "applied") applied += 1; else failed += 1;
    await client.from("shopify_apply_run_items").insert({ user_id: run.user_id, apply_run_id: run.id, change_set_item_id: item.id, status, external_product_gid: item.external_product_gid, before_snapshot_id: snapshot.data?.id ?? null, mutation_name: mutationForField(item.field_path), error_message: snapshot.error?.message ?? null, applied_at: status === "applied" ? new Date().toISOString() : null });
    await client.from("change_set_items").update({ apply_status: status, current_value_before_apply: item.current_value_at_dry_run, shopify_mutation_name: mutationForField(item.field_path), last_error: snapshot.error?.message ?? null }).eq("id", item.id).eq("user_id", run.user_id);
  }
  const status = failed ? (applied ? "partial_failed" : "failed") : "completed";
  await client.from("shopify_apply_runs").update({ status, items_applied: applied, items_failed: failed, finished_at: new Date().toISOString(), error_message: failed ? "Algunos items fallaron; revisar shopify_apply_run_items." : null }).eq("id", run.id);
  await client.from("change_sets").update({ status: status === "completed" ? "rollback_available" : "partially_applied", rollback_available: applied > 0, applied_at: new Date().toISOString(), items_applied: applied, items_failed: failed }).eq("id", run.change_set_id).eq("user_id", run.user_id);
  return { status, applied, failed };
}

export function mutationForField(fieldPath: string | null) {
  if (fieldPath === "seo.title" || fieldPath === "seo.description" || fieldPath === "descriptionHtml" || fieldPath === "bodyHtml" || fieldPath === "title" || fieldPath === "handle") return "productUpdate";
  if (fieldPath === "images.altText") return "productImageUpdate";
  return "blocked_unknown_mutation";
}
