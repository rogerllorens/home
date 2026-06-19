# Image SEO + ALT Text IA

Rankelia detecta URLs de imagen y ALT existentes en CSV ecommerce para generar sugerencias revisables de texto alternativo por producto.

## Qué hace

- Detecta columnas comunes de imagen: `Image Src`, `Images`, `Image URLs`, `image_url`, `imagen_url`, `foto_url`, `gallery_images` y variantes.
- Detecta ALT existentes: `Image Alt Text`, `alt_text`, `image_alt`, `texto alternativo` y variantes.
- Preserva ALT existentes cuando son útiles.
- Genera ALT fallback prudente si falta ALT y hay datos de producto suficientes.
- Puntúa Image SEO por fila y añade warnings de revisión humana.
- Exporta ALT en Rankelia Generic, Shopify y columnas meta orientativas para WooCommerce/PrestaShop.

## Qué no hace

- No comprime imágenes.
- No descarga ni analiza visualmente todas las imágenes.
- No publica cambios en Shopify, WooCommerce o PrestaShop.
- No garantiza rankings ni accesibilidad perfecta.
- No inventa color, material, precio, stock, envío o claims si no están en el catálogo.

## Reglas de calidad

Un ALT recomendado debe ser natural, descriptivo, de unas 5-16 palabras, normalmente 40-125 caracteres, sin keyword stuffing, sin promociones y basado en datos verificables del CSV.

## Exportaciones

- Shopify: `primary_image_url` se mapea a `Image Src` y `primary_image_alt` a `Image Alt Text`.
- WooCommerce: `Images` incluye URLs y Rankelia añade `Meta: _rankelia_image_alt` / `Meta: _rankelia_gallery_alts` como columnas no destructivas. La importación real de ALT puede requerir plugin o ajuste.
- PrestaShop: `Image URLs` incluye URLs y `Rankelia Image Alt Texts` aporta sugerencias; el importador puede requerir ajuste manual.

## QA recomendado

Probar un CSV con imagen principal, galería, ALT existente bueno, ALT malicioso tipo fórmula, URL inválida y producto sin imagen antes de abrir una beta pública.
