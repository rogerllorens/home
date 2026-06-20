import { shopifyGraphqlRequest, type ShopifyStoreForRequest } from "./graphql-client";
import type { ShopifyProductNode } from "./products";

const SHOPIFY_PRODUCT_QUERY = `query RankeliaProduct($id: ID!) { product(id: $id) { id legacyResourceId title handle vendor productType status onlineStoreUrl descriptionHtml seo { title description } tags images(first: 10) { edges { node { id url altText } } } variants(first: 20) { edges { node { id sku title price inventoryPolicy selectedOptions { name value } } } } updatedAt } }`;

type ProductResponse = { product: ShopifyProductNode | null };

export async function fetchLiveShopifyProduct(store: ShopifyStoreForRequest, productGid: string) {
  const result = await shopifyGraphqlRequest<ProductResponse>({ store, query: SHOPIFY_PRODUCT_QUERY, variables: { id: productGid }, operationName: "RankeliaProduct" });
  return { product: result.data.product, errors: result.errors, cost: result.cost };
}

export function readShopifyFieldValue(product: Record<string, unknown> | null | undefined, fieldPath: string | null) {
  if (!product || !fieldPath) return null;
  if (fieldPath === "seo.title") return (product.seo as Record<string, unknown> | undefined)?.title ?? null;
  if (fieldPath === "seo.description") return (product.seo as Record<string, unknown> | undefined)?.description ?? null;
  if (fieldPath === "descriptionHtml" || fieldPath === "bodyHtml") return product.descriptionHtml ?? product.bodyHtml ?? null;
  if (fieldPath === "title") return product.title ?? null;
  if (fieldPath === "handle") return product.handle ?? null;
  if (fieldPath === "images.altText") return null;
  return null;
}

export function valuesEqual(a: unknown, b: unknown) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}
