# Rankelia SEO/GEO Quality Engine

Rankelia sigue el principio: la IA propone, Rankelia valida, puntúa y avisa. El Quality Engine no confía en scores del modelo y recalcula señales propias a partir del CSV original, el output generado y la plataforma de exportación.

## Validadores incluidos

- Meta title: longitud recomendada 35-60, keyword natural, sin claims absolutos.
- Meta description: longitud recomendada 120-160, sin inventar envío, stock, precio ni garantía.
- Slug: minúsculas, sin acentos, sin espacios ni símbolos raros.
- HTML: estructura con respuesta inicial, H2/listas y bloque prudente de revisión.
- Schema: JSON parseable; `offers` solo con precio real; ratings/reviews/GTIN solo con datos reales.
- Claims: detecta claims no soportados como garantía, envío 24h, número 1, certificaciones, homologaciones, compatibilidades universales, reviews o ratings inventados.
- Missing data: SKU, EAN/GTIN, precio, stock, imagen, URL, ficha técnica, compatibilidad, material, dimensiones y garantía.

## Scores recalculados

- `seo_score` y `conversion_score` se recalculan después de auditar.
- `confidence_score` mide completitud/verificabilidad del CSV original.
- `eeat_score` penaliza claims no soportados y falta de datos verificables.
- `geo_ai_readiness_score` evalúa respuesta directa, estructura extraíble y FAQs.
- `rankelia_quality_score` resume issues bloqueantes y warnings.

## Publish readiness

Valores posibles: `ready`, `ready_with_warnings`, `needs_review`, `not_ready`. `human_review_required=true` cuando hay claims no soportados, schema inseguro, fallback, poca confianza o issues bloqueantes.

## Audit columns

El Rankelia Generic CSV incluye longitudes/status/issues de metadatos, slug/schema/claims/keyword stuffing, missing data, E-E-A-T, GEO/AI readiness, warnings de export, readiness, human review, prompt/model/fallback y fecha de generación.

## Limitaciones

No sustituye revisión legal, técnica ni comercial. No inventa datos faltantes: conserva el CSV original, genera contenido prudente y marca lo que debe revisar una persona antes de importar o publicar.

## Image SEO

El Quality Engine incorpora señales de imagen: URL principal, galería, ALT existentes, ALT generados/sugeridos, score de imagen, warnings y revisión humana. Un ALT con promociones, claims, stuffing o datos no verificables reduce confianza y requiere revisión.
