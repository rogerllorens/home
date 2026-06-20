
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

## GSC limitations
Search Console data can be delayed, aggregated and absent for small sites. CTR and position are averages, not guarantees. Matching is conservative and can leave URLs unmatched. Rankelia infers opportunities from Google data plus internal quality scores; Google does not recommend or approve those actions.

## Universal import limitations

- Legacy binary `.xls` is detected but not parsed; users should upload `.xlsx`, CSV or paste the table.
- XML support is basic product/feed XML, not arbitrary ERP schemas.
- Rankelia does not execute formulas/macros and does not preserve spreadsheet formatting.
- Very large catalogs should be split into batches according to plan and import limits.

## Free audit conversion limitations

- Email rendering is implemented and unit-tested, but real Resend delivery still needs staging/production smoke credentials.
- Public audit reports expire by token; users must rerun the audit after expiration.
- Import history data model exists, but full retry UI is still a follow-up.
- Legacy `.xls` remains a safe rejection.

## Prompt 6 limitations

- AI Template Studio DB/runtime/admin foundations are implemented, but full prompt CRUD editing UX is still incremental.
- Anthropic/Claude and Gemini are prepared as paused model configs, not claimed as production-tested adapters.
- Resend/GSC smoke scripts skip without real credentials.
- `.xls` legacy remains safe rejection.

## Prompt 7 limitations

- Shopify write/apply is not active; only read/import foundation is implemented.
- Shopify sync worker needs production scheduling and real app credentials.
- AI Template Studio has traceability columns and admin APIs, but full visual prompt editor/tester UX still needs polish.
- GSC code enqueues sync, but real production smoke requires Google credentials and connected property.
- Legacy `.xls` remains safe rejection.

## Prompt 8 launch limitations

- Shopify write/apply/rollback code is implemented behind strong gates, but must pass real staging smoke tests before being exposed broadly.
- Shopify image alt mutation is policy-allowed but should remain blocked or tested per API version before bulk use.
- GSC, Resend, Stripe, Storage and Shopify smoke scripts skip without real credentials.
- `npm audit --omit=dev` may still report upstream framework advisories until patched dependency versions are available and tested.
- `format:check` can remain a separate repo-wide formatting PR; do not mix mass formatting with feature work.
