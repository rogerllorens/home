# Dashboard interno

El dashboard privado carga datos reales desde Supabase: créditos, jobs, catálogo, propuestas, versiones, descargas, eventos y oportunidades internas. No inventa métricas de Search Console.

La salud SEO se calcula como media de los scores activos de propuestas: SEO, Image SEO, GEO/AEO, confidence, readiness y overall. Si no hay propuestas, se muestra estado inicial con CTA real para subir catálogo.

La acción principal se decide con Next Best Action: subir catálogo, ver progreso, revisar propuestas, aprobar alto impacto, descargar aprobadas, añadir créditos u optimizar otro lote.

## Search Console enrichment
When GSC is enabled and connected, the dashboard adds readonly Search Console status, 28d clicks/impressions/CTR/position and high-priority GSC opportunities. If GSC is disabled or disconnected, the dashboard continues to use internal catalog/proposal opportunities without fake metrics.
