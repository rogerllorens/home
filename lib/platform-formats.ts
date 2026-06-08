import type { Platform } from "@/types";

export const platformFormats: Record<Platform, string[]> = {
  Shopify: ["Handle", "Title", "Body HTML", "SEO Title", "SEO Description", "Tags", "Image Alt Text"],
  Prestashop: ["Referencia", "Nombre", "Descripción corta", "Descripción", "Meta título", "Meta descripción", "URL reescrita"],
  WooCommerce: ["SKU", "Name", "Short description", "Description", "Meta title", "Meta description", "Slug"],
  "CSV genérico": ["sku", "title", "short_description", "long_description", "meta_title", "meta_description", "slug"],
};
