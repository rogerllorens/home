export type ShopifyFieldPolicyKind = "allowed" | "dangerous" | "forbidden" | "unknown";

export type FieldPolicy = {
  fieldPath: string;
  kind: ShopifyFieldPolicyKind;
  requiresExtraConfirmation: boolean;
  message: string;
};

const normalizeField = (fieldPath: string) => fieldPath.trim().replace(/^product\./, "");

const allowed = new Set(["seo.title", "seo.description", "descriptionHtml", "bodyHtml", "images.altText"]);
const dangerous = new Set(["title", "handle"]);
const forbiddenPrefixes = [
  "price",
  "compare_at_price",
  "inventory",
  "inventory_policy",
  "variants",
  "options",
  "vendor",
  "collections",
  "status",
  "publication",
  "published",
  "productType",
  "product_type",
  "tags",
];

export function getShopifyFieldPolicy(fieldPath: string): FieldPolicy {
  const field = normalizeField(fieldPath);
  if (allowed.has(field)) return { fieldPath: field, kind: "allowed", requiresExtraConfirmation: false, message: "Campo SEO permitido para aplicación segura." };
  if (dangerous.has(field)) return { fieldPath: field, kind: "dangerous", requiresExtraConfirmation: true, message: "Campo sensible: requiere confirmación extra y no se incluye por defecto." };
  if (forbiddenPrefixes.some((prefix) => field === prefix || field.startsWith(`${prefix}.`))) {
    return { fieldPath: field, kind: "forbidden", requiresExtraConfirmation: false, message: "Campo bloqueado: Rankelia no toca precios, inventario, variantes, vendor, colecciones, estado ni publicación." };
  }
  return { fieldPath: field, kind: "unknown", requiresExtraConfirmation: false, message: "Campo desconocido: se rechaza por defecto." };
}

export const isAllowedShopifyField = (fieldPath: string) => getShopifyFieldPolicy(fieldPath).kind === "allowed";
export const isDangerousShopifyField = (fieldPath: string) => getShopifyFieldPolicy(fieldPath).kind === "dangerous";
export const isForbiddenShopifyField = (fieldPath: string) => getShopifyFieldPolicy(fieldPath).kind === "forbidden";

export function validateChangeSetFields(fields: string[]) {
  const policies = fields.map(getShopifyFieldPolicy);
  const blockers = policies.filter((policy) => policy.kind === "forbidden" || policy.kind === "unknown");
  const warnings = policies.filter((policy) => policy.kind === "dangerous");
  return { ok: blockers.length === 0, policies, blockers, warnings };
}
