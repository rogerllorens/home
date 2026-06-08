# Exports ecommerce CSV

Rankelia genera CSVs orientados a importación manual. No hay sincronización directa ni publicación automática. Importa primero 5-10 productos de prueba y revisa configuración de idioma, categorías, impuestos, atributos, variantes e imágenes.

## Rankelia Generic CSV

Columnas: `sku`, `nombre_original`, `nombre_seo`, `marca`, `categoria`, `subcategoria`, `keyword_principal`, `keywords_secundarias`, `keywords_long_tail`, `entidades_relacionadas`, `descripcion_corta`, `descripcion_larga_html`, `bullet_points`, `beneficios`, `caracteristicas_tecnicas`, `casos_uso`, `meta_title`, `meta_description`, `slug`, `faqs_json`, `schema_product_json`, `alt_texts`, `tags`, `enlaces_internos_sugeridos`, `cta`, `seo_score`, `conversion_score`, `quality_warnings`, `status`, `error_message`.

## Shopify CSV orientado

Columnas: `Handle`, `Title`, `Body (HTML)`, `Vendor`, `Product Category`, `Type`, `Tags`, `Published`, `Option1 Name`, `Option1 Value`, `Variant SKU`, `Variant Price`, `Image Src`, `Image Alt Text`, `SEO Title`, `SEO Description`, `Status`, `Rankelia Warnings`.

Limitaciones: variantes complejas, taxonomía exacta, imágenes externas y apps SEO pueden requerir ajustes. En beta se prefiere `draft`/`FALSE` para revisión manual.

## WooCommerce CSV orientado

Columnas: `Type`, `SKU`, `Name`, `Published`, `Short description`, `Description`, `Regular price`, `Categories`, `Tags`, `Images`, `Meta: _yoast_wpseo_title`, `Meta: _yoast_wpseo_metadesc`, `Rankelia Warnings`.

Limitaciones: productos variables, atributos, jerarquía de categorías e integración Yoast dependen de plugins/configuración.

## PrestaShop CSV orientado

Columnas: `ID`, `Name`, `Categories`, `Price tax excluded`, `Reference`, `Short description`, `Description`, `Meta title`, `Meta keywords`, `Meta description`, `URL rewritten`, `Image URLs`, `Active`, `Rankelia Warnings`.

Limitaciones: impuestos, combinaciones, atributos, multitienda, idiomas y categorías existentes requieren revisión. En beta se prefiere `Active=0`.

## Warnings por plataforma

Cada export añade `Rankelia Warnings` cuando faltan SKU, precio, imagen, slug, categoría, HTML, metadatos o cuando el formato requiere revisión manual por variantes/taxonomía/plugins. Estos warnings también aparecen en reportes para revisión humana.


## Audit columns

Rankelia Generic CSV incluye `meta_title_length`, `meta_title_status`, `meta_description_length`, `slug_status`, `schema_status`, `claim_status`, `unsupported_claims_detected`, `keyword_stuffing_status`, `missing_data`, `eeat_score`, `geo_ai_readiness_score`, `platform_export_status`, `ready_to_publish`, `human_review_required`, `main_quality_issue`, `blocking_issues`, `non_blocking_warnings`, `rankelia_quality_score`, `confidence_score`, `prompt_version`, `model_used`, `fallback_used` y `generated_at`.
