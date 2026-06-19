export function normalizeImageWarning(warning: string) {
  const map: Record<string, string> = {
    missing_alt: "ALT ausente.", empty_alt: "ALT vacío.", too_short: "ALT demasiado corto.", too_long: "ALT demasiado largo.", keyword_stuffing: "Posible keyword stuffing en ALT.", duplicate_alt: "ALT duplicado en galería.", generic_alt: "ALT genérico.", filename_alt: "ALT parece nombre de archivo.", unsupported_claim: "ALT contiene claim no verificable.", no_image_url: "No hay URL de imagen.", too_many_images: "Demasiadas imágenes; se procesan las primeras 10.", image_url_invalid: "URL de imagen no válida.", alt_repeats_product_name_exactly: "ALT repite el nombre sin aportar contexto.", alt_contains_price_or_promo: "ALT contiene precio, stock, envío o promoción.", human_review_required: "Revisión humana requerida.",
  };
  return map[warning] ?? warning;
}
