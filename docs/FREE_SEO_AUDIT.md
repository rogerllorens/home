# Free SEO Audit Engine

La auditoría SEO gratis es un lead magnet seguro para analizar la home pública de un ecommerce antes de que el usuario suba su catálogo CSV.

## Qué analiza

- HTML estático de la URL introducida: title, meta description, H1/H2, canonical, robots meta, idioma, viewport y texto aproximado.
- Enlaces internos/externos básicos.
- Imágenes presentes en el HTML: ALT, ALT vacío, dimensiones, lazy loading y señales WebP/AVIF.
- Schema JSON-LD básico: Product, Organization/WebSite, BreadcrumbList, FAQPage, Article, CollectionPage e ItemList.
- robots.txt y sitemap.xml básicos, sin crawl masivo.
- Detección conservadora de plataforma: Shopify, WooCommerce/WordPress, PrestaShop, Magento, Shopware, Wix, Squarespace o desconocida.
- Scores 0-100 para SEO, técnico, imágenes, schema, indexabilidad, GEO/AEO y global.

## Qué no analiza

- No ejecuta JavaScript remoto.
- No usa navegador/headless browser.
- No llama a PageSpeed API.
- No conecta Google Search Console todavía.
- No hace crawler completo ni auditoría tipo Screaming Frog.
- No garantiza indexación ni rankings.
- No corrige automáticamente la tienda.

## Seguridad SSRF

`validateAuditUrl` solo acepta HTTP/HTTPS, bloquea credenciales, puertos no estándar, localhost, IPs privadas/link-local, dominios `.local`, `.internal`, `.test`, `.localhost` y endpoints metadata cloud. Además resuelve DNS y `safeFetchHtml` revalida cada redirect antes de seguirlo.

## Safe fetch

La auditoría usa `RankeliaBot/0.1 (+https://rankelia.ai)`, timeout corto, máximo 3 redirects, límite de HTML configurable (`FREE_AUDIT_MAX_BYTES`, por defecto 2 MB) y no envía cookies ni credenciales.

## Rate limits

`POST /api/free-audit` reutiliza el rate limit existente:

- IP: 5 auditorías/hora.
- Dominio: 10 auditorías/día.
- Usuario autenticado: 20 auditorías/día.
- Email lead: 5 auditorías/día.

Si Upstash Redis está configurado, el límite es distribuido. Si no, se usa memoria local para dev/beta.

## Persistencia Supabase

La migración `supabase/sql/011_free_seo_audits.sql` crea `free_seo_audits` con RLS activo. El endpoint guarda auditorías con service role server-side. Los usuarios autenticados solo leen sus auditorías; admins pueden leer todas. Las auditorías anónimas no son listables públicamente.

## Variables opcionales

```env
FREE_AUDIT_TIMEOUT_MS=9000
FREE_AUDIT_MAX_REDIRECTS=3
FREE_AUDIT_MAX_BYTES=2000000
```

## Cómo probar

1. Ejecuta migraciones hasta `011_free_seo_audits.sql`.
2. Configura Supabase service role en servidor.
3. Abre la home y prueba una URL pública real.
4. Prueba URLs bloqueadas: `localhost`, `127.0.0.1`, `192.168.1.1`, `file:///etc/passwd`.
5. Verifica que el resultado no contiene HTML completo ni stack traces.

## v1.1

- Página compartible con token público seguro.
- PDF/email del informe.
- PageSpeed API opcional.
- Search Console.
- Crawl limitado de categorías/productos.
- Broken links básico.

## PageSpeed enrichment

If configured, the audit also calls PageSpeed Insights for mobile and desktop. Failure, timeout, quota or missing API key does not block the basic SEO audit. See `docs/PAGESPEED_AUDIT.md`.

## Advanced Schema, GEO/AEO and llms.txt

The free audit now includes structured data diagnostics, GEO/AEO readiness and a downloadable `llms.txt` proposal. These are recommendations only and do not guarantee rich results or AI visibility.

## Conexión Image SEO

La auditoría gratuita detecta imágenes sin ALT útil en el HTML público y lo convierte en oportunidad comercial: subir catálogo para generar ALT text SEO revisable por producto. No genera ALT masivo desde una URL auditada ni analiza visualmente imágenes en esta fase.
