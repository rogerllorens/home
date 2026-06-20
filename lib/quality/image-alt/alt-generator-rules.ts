import type { ImageAltContext } from "./types";
import { validateImageAlt } from "./alt-validator";

const clean = (value?: string) => String(value ?? "").replace(/[|;\n]+/g, " ").replace(/\s+/g, " ").trim();
const truncate = (value: string, max = 125) => value.length <= max ? value : value.slice(0, max - 1).trim().replace(/[,.]$/, "") + "…";

export function generateFallbackImageAlt(context: ImageAltContext, variant: "primary" | "gallery" = "primary", index = 0) {
  const name = clean(context.productName || context.keyword || context.sku);
  const brand = clean(context.brand);
  const category = clean(context.category);
  if (!name && !category) return { alt: "", warning: "Datos insuficientes para generar ALT fiable." };
  const withBrand = name && brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} ${brand}` : name || brand;
  const base = [withBrand, category && !withBrand.toLowerCase().includes(category.toLowerCase()) ? category : ""].filter(Boolean).join(" para ");
  const suffix = variant === "gallery" && index > 0 ? " - vista adicional para revisión" : "";
  const candidate = truncate(`${base}${suffix}`);
  const evaluated = validateImageAlt(candidate, context);
  return { alt: candidate, warning: evaluated.status === "good" ? "" : "ALT fallback requiere revisión humana." };
}
