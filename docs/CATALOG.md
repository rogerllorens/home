# Catálogo

`/app/catalog` lista `catalog_items` del usuario con la propuesta asociada cuando existe. El detalle `/app/catalog/[id]` muestra producto, SKU, categoría, scores before/after y diff reutilizando el modelo de propuestas.

No carga catálogos completos sin límite: la API limita resultados y soporta búsqueda simple por producto, SKU o URL.

## GSC columns and product detail
Catalog rows show GSC 28d impressions/CTR only for products matched to Search Console URLs. Product detail shows matched URL, top queries and average metrics when available; unmatched products remain visible without fabricated data.
