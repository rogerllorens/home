# Changelog

## 1.2.1
- Unificación de capabilities en admin (`manage_woocommerce`) para Settings, Debug y Validation Tester.
- Refactor interno a `ValidatorService` (lógica) + `Validator` (adaptador de hooks) para evitar side-effects en herramientas admin.
- Añadidos presets de configuración rápida (B2B EU, Permissive, ES Only).
- Endurecimiento de CI con PHPCS (WPCS subset) y PHPStan nivel 2.

## 1.2.0
- Separación Lite/Pro: limpieza del core Lite para WP.org y hooks estables para extensión Pro.
- Cobertura de tests unitarios/integración para matrix de configuración, extractor, hooks Classic/Store API y uninstall.
