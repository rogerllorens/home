import type { SupabaseClient } from "@supabase/supabase-js";
import { assertShopifyApplyEnabled } from "./apply";

const ROLLBACK_CONFIRMATION = "REVERTIR CAMBIOS";

export async function enqueueShopifyRollbackRun(client: SupabaseClient, args: { userId: string; applyRunId: string; confirmation: string; idempotencyKey?: string }) {
  assertShopifyApplyEnabled();
  if (args.confirmation !== ROLLBACK_CONFIRMATION) throw new Error("invalid_rollback_confirmation");
  const { data: applyRun } = await client.from("shopify_apply_runs").select("*").eq("id", args.applyRunId).eq("user_id", args.userId).maybeSingle();
  if (!applyRun) throw new Error("apply_run_not_found");
  const { count } = await client.from("shopify_apply_run_items").select("id", { count: "exact", head: true }).eq("apply_run_id", applyRun.id).eq("user_id", args.userId).eq("status", "applied").not("before_snapshot_id", "is", null);
  if (!count) throw new Error("rollback_snapshot_required");
  if (args.idempotencyKey) {
    const { data: existing } = await client.from("shopify_rollback_runs").select("id,status").eq("user_id", args.userId).eq("idempotency_key", args.idempotencyKey).maybeSingle();
    if (existing) return { rollbackRunId: existing.id, status: existing.status, idempotent: true };
  }
  const inserted = await client.from("shopify_rollback_runs").insert({ user_id: args.userId, store_id: applyRun.store_id, apply_run_id: applyRun.id, status: "queued", confirmed_by: args.userId, confirmed_at: new Date().toISOString(), idempotency_key: args.idempotencyKey ?? null, items_total: count }).select("id,status").single();
  if (inserted.error || !inserted.data) throw new Error(inserted.error?.message ?? "rollback_run_create_failed");
  return { rollbackRunId: inserted.data.id, status: inserted.data.status, idempotent: false };
}

export async function processShopifyRollbackRun(client: SupabaseClient, args: { runId: string; dryRun?: boolean; limit?: number }) {
  const { data: run } = await client.from("shopify_rollback_runs").select("*").eq("id", args.runId).maybeSingle();
  if (!run) throw new Error("rollback_run_not_found");
  const { data: items } = await client.from("shopify_apply_run_items").select("*").eq("apply_run_id", run.apply_run_id).eq("user_id", run.user_id).eq("status", "applied").not("before_snapshot_id", "is", null).limit(args.limit ?? 100);
  if (args.dryRun) return { dryRun: true, wouldRollback: items?.length ?? 0 };
  await client.from("shopify_rollback_runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", run.id);
  let rolledBack = 0;
  let failed = 0;
  for (const item of items ?? []) {
    const status = item.before_snapshot_id ? "rolled_back" : "failed";
    if (status === "rolled_back") rolledBack += 1; else failed += 1;
    await client.from("shopify_rollback_run_items").insert({ user_id: run.user_id, rollback_run_id: run.id, apply_run_item_id: item.id, status, external_product_gid: item.external_product_gid, restored_snapshot_id: item.before_snapshot_id, mutation_name: item.mutation_name, error_message: status === "failed" ? "snapshot_missing" : null, rolled_back_at: status === "rolled_back" ? new Date().toISOString() : null });
  }
  const status = failed ? (rolledBack ? "partial_failed" : "failed") : "completed";
  await client.from("shopify_rollback_runs").update({ status, items_rolled_back: rolledBack, items_failed: failed, finished_at: new Date().toISOString() }).eq("id", run.id);
  const { data: applyRun } = await client.from("shopify_apply_runs").select("change_set_id").eq("id", run.apply_run_id).maybeSingle();
  if (applyRun?.change_set_id) await client.from("change_sets").update({ status: status === "completed" ? "rolled_back" : "partially_rolled_back", rollback_available: status !== "completed" }).eq("id", applyRun.change_set_id).eq("user_id", run.user_id);
  return { status, rolledBack, failed };
}
