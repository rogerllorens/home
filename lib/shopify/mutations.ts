import { getShopifyFieldPolicy } from "./field-policy";

export type ShopifyMutationPlan = { mutationName: string; query: string; variables: Record<string, unknown>; verifyFieldPath: string };

const PRODUCT_UPDATE = `mutation RankeliaProductUpdate($input: ProductInput!) { productUpdate(input: $input) { product { id title handle descriptionHtml seo { title description } } userErrors { field message } } }`;

export function buildShopifyMutationPlan(productGid: string, fieldPath: string, proposedValue: unknown): ShopifyMutationPlan {
  const policy = getShopifyFieldPolicy(fieldPath);
  if (policy.kind !== "allowed") throw new Error(`shopify_field_not_apply_allowed:${fieldPath}`);
  if (fieldPath === "images.altText" && process.env.SHOPIFY_IMAGE_ALT_WRITE_ENABLED !== "true") throw new Error("shopify_image_alt_write_not_validated");
  if (fieldPath === "images.altText") throw new Error("shopify_image_alt_mutation_not_implemented");
  const input: Record<string, unknown> = { id: productGid };
  if (fieldPath === "seo.title") input.seo = { title: String(proposedValue ?? "") };
  else if (fieldPath === "seo.description") input.seo = { description: String(proposedValue ?? "") };
  else if (fieldPath === "descriptionHtml" || fieldPath === "bodyHtml") input.descriptionHtml = String(proposedValue ?? "");
  else throw new Error(`shopify_field_not_supported_for_apply:${fieldPath}`);
  return { mutationName: "productUpdate", query: PRODUCT_UPDATE, variables: { input }, verifyFieldPath: fieldPath };
}
