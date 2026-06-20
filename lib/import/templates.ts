export type ImportTemplateId = "generic" | "shopify" | "woocommerce" | "prestashop" | "fashion" | "electronics" | "food" | "industrial" | "home" | "cosmetics" | "spare_parts";

type ImportTemplate = { filename: string; description: string; headers: string[]; rows: string[][] };

const safe = (value: string) => /^[=+\-@]/.test(value) ? `'${value}` : value;
const toCsv = (headers: string[], rows: string[][]) => "\uFEFF" + [headers, ...rows].map((row) => row.map((value) => `"${safe(value).replace(/"/g, '""')}"`).join(",")).join("\n");

const genericHeaders = ["product_name", "sku", "category", "brand", "description", "short_description", "product_url", "image_url", "image_alt", "meta_title", "meta_description", "keywords", "price", "stock"];

const genericRow = ["Producto profesional ejemplo", "SKU-001", "Categoría ejemplo", "Marca ejemplo", "Descripción completa del producto con materiales, uso recomendado y beneficios reales.", "Resumen breve del producto.", "https://example.com/producto", "https://example.com/producto.jpg", "Producto ejemplo sobre fondo blanco", "", "", "producto ejemplo", "49.90", "25"];

const verticalTemplate = (id: Exclude<ImportTemplateId, "generic" | "shopify" | "woocommerce" | "prestashop">, label: string, row: string[]): ImportTemplate => ({
  filename: `rankelia-${id}-template.csv`,
  description: `Plantilla ${label}`,
  headers: genericHeaders,
  rows: [row]
});

export const importTemplates: Record<ImportTemplateId, ImportTemplate> = {
  generic: { filename: "rankelia-generic-template.csv", description: "Plantilla genérica Rankelia", headers: genericHeaders, rows: [genericRow] },
  shopify: { filename: "rankelia-shopify-template.csv", description: "Plantilla Shopify", headers: ["Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags", "Variant SKU", "Variant Price", "Image Src", "Image Alt Text", "SEO Title", "SEO Description"], rows: [["producto-profesional-ejemplo", "Producto profesional ejemplo", "Descripción HTML segura del producto", "Marca ejemplo", "Apparel & Accessories", "Tipo ejemplo", "seo, ecommerce", "SKU-001", "49.90", "https://example.com/producto.jpg", "Producto ejemplo sobre fondo blanco", "", ""]] },
  woocommerce: { filename: "rankelia-woocommerce-template.csv", description: "Plantilla WooCommerce", headers: ["ID", "Type", "SKU", "Name", "Short description", "Description", "Categories", "Tags", "Regular price", "Images", "Meta: _yoast_wpseo_title", "Meta: _yoast_wpseo_metadesc"], rows: [["", "simple", "SKU-001", "Producto profesional ejemplo", "Resumen breve del producto", "Descripción completa del producto", "Categoría ejemplo", "seo", "49.90", "https://example.com/producto.jpg", "", ""]] },
  prestashop: { filename: "rankelia-prestashop-template.csv", description: "Plantilla PrestaShop", headers: ["ID", "Active", "Name", "Categories", "Price tax included", "Reference", "Manufacturer", "Summary", "Description", "Meta title", "Meta description", "URL rewritten", "Image URLs"], rows: [["", "1", "Producto profesional ejemplo", "Categoría ejemplo", "49.90", "SKU-001", "Marca ejemplo", "Resumen breve", "Descripción completa", "", "", "producto-profesional-ejemplo", "https://example.com/producto.jpg"]] },
  fashion: verticalTemplate("fashion", "Moda", ["Camisa lino regular fit", "MODA-001", "Moda", "Marca ejemplo", "Camisa de lino transpirable para uso diario.", "Camisa ligera de lino.", "https://example.com/camisa", "https://example.com/camisa.jpg", "Camisa de lino beige", "", "", "camisa lino", "39.90", "40"]),
  electronics: verticalTemplate("electronics", "Electrónica", ["Auriculares inalámbricos", "ELEC-001", "Electrónica", "Marca ejemplo", "Auriculares bluetooth con estuche de carga y micrófono integrado.", "Auriculares bluetooth compactos.", "https://example.com/auriculares", "https://example.com/auriculares.jpg", "Auriculares inalámbricos negros", "", "", "auriculares bluetooth", "59.90", "15"]),
  food: verticalTemplate("food", "Alimentación", ["Aceite de oliva virgen extra", "FOOD-001", "Alimentación", "Marca ejemplo", "Aceite de oliva virgen extra en botella de cristal.", "Aceite de oliva virgen extra.", "https://example.com/aceite", "https://example.com/aceite.jpg", "Botella de aceite de oliva", "", "", "aceite oliva virgen extra", "12.90", "80"]),
  industrial: verticalTemplate("industrial", "Industrial/B2B", ["Taladro percutor profesional", "IND-001", "Herramientas", "Marca ejemplo", "Taladro percutor para trabajos profesionales con empuñadura auxiliar.", "Taladro percutor profesional.", "https://example.com/taladro", "https://example.com/taladro.jpg", "Taladro percutor con maletín", "", "", "taladro percutor profesional", "89.90", "12"]),
  home: verticalTemplate("home", "Hogar/decoración", ["Lámpara de mesa cerámica", "HOME-001", "Iluminación", "Marca ejemplo", "Lámpara de mesa con base cerámica y pantalla textil.", "Lámpara decorativa de mesa.", "https://example.com/lampara", "https://example.com/lampara.jpg", "Lámpara de mesa blanca", "", "", "lampara mesa", "34.90", "30"]),
  cosmetics: verticalTemplate("cosmetics", "Cosmética", ["Crema hidratante facial", "COS-001", "Cosmética", "Marca ejemplo", "Crema hidratante facial para uso diario con textura ligera.", "Crema hidratante facial.", "https://example.com/crema", "https://example.com/crema.jpg", "Tarro de crema hidratante", "", "", "crema hidratante facial", "19.90", "55"]),
  spare_parts: verticalTemplate("spare_parts", "Recambios", ["Filtro de aire compatible", "REC-001", "Recambios", "Marca ejemplo", "Filtro de aire compatible con modelos seleccionados.", "Filtro de aire de recambio.", "https://example.com/filtro", "https://example.com/filtro.jpg", "Filtro de aire rectangular", "", "", "filtro aire recambio", "14.90", "120"])
};

export function buildTemplateCsv(id: ImportTemplateId) {
  const template = importTemplates[id] ?? importTemplates.generic;
  return { ...template, csv: toCsv(template.headers, template.rows) };
}
