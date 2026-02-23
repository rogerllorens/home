# TaxID Guard for WooCommerce

TaxID Guard añade dos campos al checkout de WooCommerce (Classic y Blocks):
- `I am a company`
- `Tax Identifier (NIF/CIF/NIE/VAT/EIN)`

Después normaliza, valida y guarda metadatos en pedido; en Pro añade VIES, reglas B2B avanzadas y export CSV.

## Estructura

```text
taxid-guard-for-woocommerce/
├─ taxid-guard.php
├─ uninstall.php
├─ assets/
└─ includes/
```

## Notas

- Compatible con HPOS (declaración de compatibilidad en el entry-point).
- Soporta checkout clásico y checkout Blocks (Store API).
- Incluye export/erase de metadatos de usuario para privacidad.
