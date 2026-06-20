import { createServiceClient } from "../lib/supabase/admin";
import { processShopifyRollbackRun } from "../lib/shopify/rollback";
const args = new Map(process.argv.slice(2).map((arg) => { const [key, value = "true"] = arg.replace(/^--/, "").split("="); return [key, value]; }));
async function main() {
  if (process.env.SHOPIFY_WRITE_ENABLED !== "true") { console.log("SKIP: SHOPIFY_WRITE_ENABLED is not true; rollback worker will not mutate Shopify."); return; }
  const runId = args.get("run-id");
  if (!runId) { console.log("SKIP: provide --run-id=<shopify_rollback_run_id>."); return; }
  const result = await processShopifyRollbackRun(createServiceClient(), { runId, dryRun: args.has("dry-run"), limit: args.has("limit") ? Number(args.get("limit")) : undefined });
  console.log(JSON.stringify(result, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
