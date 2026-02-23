# TaxID Guard for WooCommerce

TaxID Guard añade los campos fiscales B2B al checkout de WooCommerce y valida/guarda el dato en pedido de forma compatible con **Classic** y **Blocks (Store API)**.

## Lite vs Pro

| Funcionalidad | Lite | Pro |
|---|---:|---:|
| Campo Tax ID + Company checkbox | ✅ | ✅ |
| Validación ES (NIF/NIE/CIF) | ✅ | ✅ |
| Validación patrón EU VAT | ✅ | ✅ |
| Checkout Classic + Blocks | ✅ | ✅ |
| Diagnóstico + Validation Tester | ✅ | ✅ |
| VIES en tiempo real | ❌ | ✅ |
| Reglas B2B avanzadas | ❌ | ✅ |
| Export CSV avanzado | ❌ | ✅ |

## Guía rápida (Lite)

1. Ir a **WooCommerce → TaxID Guard**.
2. Elegir modo:
   - `validate` para bloquear checkout si el dato no es válido.
   - `collect` para recopilar sin bloquear.
3. Configurar `Show Tax ID field` (`always`, `company`, `no`).
4. Opcional: usar presets rápidos:
   - **Preset B2B EU**
   - **Preset Permissive**
   - **Preset ES Only**
5. Guardar cambios.

## Compatibilidad

- HPOS: declarado como compatible.
- WooCommerce Checkout:
  - Classic hooks
  - Store API / Blocks hooks

## FAQ

### ¿Funciona con checkout Blocks?
Sí, el plugin extrae `additional_fields` del payload Store API y aplica el mismo pipeline de validación.

### ¿VIES está disponible en Lite?
No. VIES es Pro.

### ¿VIES requiere algo en servidor?
Sí, la validación VIES (Pro) requiere la extensión **SOAP** de PHP habilitada.

## Desarrollo

CI ejecuta:
- `php -l`
- `phpunit`
- `phpcs` (WPCS subset)
- `phpstan` (nivel 2)

## Changelog

Consulta `CHANGELOG.md`.


## Estado actual (implementado)

### Lite (hoy)
- Campo Tax ID + Company checkbox en Classic y Blocks.
- Validación local ES/EU pattern + modo `collect/validate`.
- Diagnostics + Validation Tester.
- Guardado en pedido, badges y privacidad export/erase.

### Pro (hoy, en `dist/taxid-guard-pro/`)
- VIES online con timeout corto, retry simple, caché por VAT y circuit-breaker con fail-mode `allow/block`.
- Reglas B2B de requisito por rol, umbral de carrito y reglas de exclusión por pago/envío/virtual.
- Dependencia de Lite + licencia Freemius activa.

## Roadmap Pro (siguiente nivel)
- Export CSV/XLSX con filtros por país/estado VIES.
- Revalidación masiva de VIES por lotes con rate-limit.
- Integraciones de facturación (Holded/Quaderno/FacturaScripts) como add-ons.


## Lite VAT features
- VAT exemption mode for valid company VAT numbers (configurable).
- B2C location evidence capture (billing/shipping/IP country + conflict flag).
- Digital-goods mode for virtual/downloadable carts.
- VAT field on signup/account (optional).
- EU VAT rates importer page (no remote calls).
