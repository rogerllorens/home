import type { AuditFinding } from "../types";
export function auditProductSchema(products: Record<string, unknown>[], hasVisibleProductSignal: boolean): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const product of products) {
    if (!product.name) findings.push({ severity: "critical", category: "schema", title: "Product schema sin name", description: "Un Product schema no tiene nombre.", recommendation: "Usa Product solo con datos reales visibles del producto.", impact: "high", effort: "low" });
    if (!product.image) findings.push({ severity: "warning", category: "schema", title: "Product schema sin image", description: "Falta imagen en Product schema.", recommendation: "Añade image solo si existe imagen real del producto.", impact: "medium", effort: "low" });
    if (!product.brand) findings.push({ severity: "warning", category: "schema", title: "Product schema sin brand", description: "No se detecta marca en Product schema.", recommendation: "Añade brand si está disponible en catálogo o página.", impact: "medium", effort: "low" });
    if (!product.sku) findings.push({ severity: "opportunity", category: "schema", title: "Product schema sin SKU", description: "No se detecta SKU.", recommendation: "Añade SKU si existe en el catálogo.", impact: "low", effort: "low" });
    if (!product.offers) findings.push({ severity: "warning", category: "schema", title: "Product schema sin offers", description: "No se detectan ofertas/precio/disponibilidad.", recommendation: "Añade offers solo si precio y disponibilidad son reales y visibles.", impact: "medium", effort: "medium" });
    if (product.aggregateRating || product.review) findings.push({ severity: "warning", category: "schema", title: "Ratings/reviews en Product schema", description: "Detectamos rating o reviews en schema.", recommendation: "Verifica que existan reseñas reales visibles; elimina ratings inventados.", impact: "high", effort: "medium" });
  }
  if (products.length && !hasVisibleProductSignal) findings.push({ severity: "warning", category: "schema", title: "Product schema en página sin producto claro", description: "La página auditada no parece una ficha de producto clara.", recommendation: "Usa Product en fichas de producto; para listados usa ItemList/CollectionPage.", impact: "medium", effort: "medium" });
  return findings;
}
