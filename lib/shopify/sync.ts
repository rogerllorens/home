import type { SupabaseClient } from "@supabase/supabase-js";
import { getShopifyConfig } from "./config";
import { SHOPIFY_PRODUCTS_QUERY, type ShopifyProductNode } from "./products";
import { shopifyGraphqlRequest, respectShopifyGraphqlCostBudget } from "./graphql-client";
import { mapShopifyProductRecord, mapShopifyProductToCatalogItem } from "./mapper";

type ProductsResponse = { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; edges: Array<{ node: ShopifyProductNode }> } };
type ShopifyStoreRow = { id: string; myshopify_domain: string; access_token_encrypted: string };

export async function syncShopifyProducts(client: SupabaseClient, args: { runId?: string; userId: string; storeId: string; limit?: number; dryRun?: boolean }) {
  const store = (await client.from("shopify_stores").select("*").eq("id", args.storeId).eq("user_id", args.userId).maybeSingle()).data as ShopifyStoreRow | null;
  if (!store) throw new Error("shopify_store_not_found");
  const config = getShopifyConfig();
  let after: string | null = null;
  let seen = 0;
  const max = Math.min(args.limit ?? config.maxProducts, config.maxProducts);
  if (args.runId && !args.dryRun) await client.from("shopify_sync_runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", args.runId).eq("user_id", args.userId);
  do {
    const graphqlResult: Awaited<ReturnType<typeof shopifyGraphqlRequest<ProductsResponse>>> = await shopifyGraphqlRequest<ProductsResponse>({ store, query: SHOPIFY_PRODUCTS_QUERY, variables: { first: Math.min(config.batchSize, max - seen), after } });
    const products: ShopifyProductNode[] = graphqlResult.data.products.edges.map((edge: { node: ShopifyProductNode }) => edge.node);
    seen += products.length;
    if (!args.dryRun && products.length) {
      for (const product of products) {
        const catalogPayload = { ...mapShopifyProductToCatalogItem(product, args.userId), shopify_store_id: store.id, shopify_product_gid: product.id, import_source_type: "shopify" };
        const catalog = await client.from("catalog_items").upsert(catalogPayload, { onConflict: "shopify_store_id,shopify_product_gid" }).select("id").single();
        const productPayload = { ...mapShopifyProductRecord(product, args.userId, store.id), catalog_item_id: catalog.data?.id ?? null };
        await client.from("shopify_products").upsert(productPayload, { onConflict: "store_id,shopify_product_gid" });
        await client.from("shopify_product_snapshots").insert({ user_id: args.userId, store_id: store.id, shopify_product_gid: product.id, snapshot_type: "sync", snapshot: product, source: "shopify_sync" });
      }
    }
    after = graphqlResult.data.products.pageInfo.hasNextPage ? graphqlResult.data.products.pageInfo.endCursor : null;
    const wait = respectShopifyGraphqlCostBudget(graphqlResult.cost);
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  } while (after && seen < max);
  if (args.runId && !args.dryRun) await client.from("shopify_sync_runs").update({ status: "completed", products_seen: seen, products_created: seen, finished_at: new Date().toISOString() }).eq("id", args.runId).eq("user_id", args.userId);
  return { productsSeen: seen, dryRun: Boolean(args.dryRun) };
}
