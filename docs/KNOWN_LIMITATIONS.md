
# Known limitations

- Schema Audit is not a replacement for Google Rich Results Test.
- GEO/AEO score is an estimate, not a guarantee of AI visibility.
- llms.txt is emerging/non-official and must be reviewed manually.
- GSC integration remains marked as upcoming until the connector is implemented.

- Image SEO no comprime imágenes, no las descarga masivamente y no hace visión IA avanzada todavía.
- ALT para WooCommerce/PrestaShop puede requerir campos personalizados, plugins o ajuste manual del importador.
- Galerías complejas se exportan de forma orientativa y deben probarse con 5-10 productos antes de importar masivamente.

- Supabase local RLS integration tests are prepared in CI as a manual placeholder; full Docker-backed integration coverage remains pending.
- Prettier config is added, but full-codebase formatting should be a separate PR to avoid mixing security logic and cosmetic diffs.

## Proposals beta limitations

- Field regeneration uses the versioning contract and safe fallback regeneration in this prompt; richer provider-specific prompts can be added later.
- Approved exports are private download records and do not publish to Shopify/WooCommerce/PrestaShop automatically.
- Supabase integration tests for RLS should be added before public launch.

## Dashboard Prompt 2

- Las oportunidades no usan Search Console; se basan en calidad interna del catálogo y propuestas.
- Los gráficos son ligeros CSS/SVG y no sustituyen analítica avanzada.
- La búsqueda de catálogo es básica y limitada para evitar cargas grandes.
- La regeneración por campo sigue siendo beta template-safe hasta integrar prompts IA por scope.
