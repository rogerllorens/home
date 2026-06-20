import { createServiceClient } from "@/lib/supabase/admin";
import { isShopifyEnabled, syncShopifyProducts } from "@/lib/shopify";

const args = new Set(process.argv.slice(2));
const valueOf = (name: string) => { const arg = process.argv.find((item) => item.startsWith(`${name}=`)); return arg?.split("=").slice(1).join("="); };

async function main() {
  const dryRun = args.has("--dry-run");
  const runId = valueOf("--run-id");
  const storeId = valueOf("--store-id");
  const userId = valueOf("--user-id");
  const limit = valueOf("--limit") ? Number(valueOf("--limit")) : undefined;
  if (!isShopifyEnabled()) { console.log(JSON.stringify({ skipped: true, reason: "SHOPIFY_ENABLED is not true" })); return; }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) { console.log(JSON.stringify({ skipped: true, reason: "Supabase service env missing" })); return; }
  const supabase = createServiceClient();
  const run = runId ? (await supabase.from("shopify_sync_runs").select("id,user_id,store_id").eq("id", runId).maybeSingle()).data : null;
  const targetUserId = userId ?? run?.user_id;
  const targetStoreId = storeId ?? run?.store_id;
  if (!targetUserId || !targetStoreId) { console.log(JSON.stringify({ skipped: true, reason: "Provide --run-id or --user-id and --store-id" })); return; }
  const result = await syncShopifyProducts(supabase, { runId: runId ?? undefined, userId: targetUserId, storeId: targetStoreId, limit, dryRun });
  console.log(JSON.stringify({ ok: true, ...result }));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
