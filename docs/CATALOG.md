# Catálogo

`/app/catalog` lista `catalog_items` del usuario con la propuesta asociada cuando existe. El detalle `/app/catalog/[id]` muestra producto, SKU, categoría, scores before/after y diff reutilizando el modelo de propuestas.

No carga catálogos completos sin límite: la API limita resultados y soporta búsqueda simple por producto, SKU o URL.
