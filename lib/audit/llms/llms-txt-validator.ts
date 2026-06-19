export function validateLlmsTxt(content: string) {
  const warnings: string[] = [];
  if (!content.includes("- Home:")) warnings.push("Falta Home.");
  if (!content.includes("Sitemap:")) warnings.push("Falta sitemap.");
  if (!content.includes("precio") || !content.includes("stock")) warnings.push("Falta disclaimer de precio/stock.");
  return { valid: warnings.length === 0, warnings };
}
