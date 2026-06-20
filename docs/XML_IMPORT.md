# XML Import

XML import is intentionally basic and safe. Rankelia supports repeated product-like nodes such as `product`, `item`, `entry` and `offer`, including simple RSS/merchant-like feeds with namespaced fields such as `g:title`.

Unsupported: arbitrary ERP XML, external entities, DTD, ENTITY expansion, deep nested graphs and fetching referenced URLs. Files containing `DOCTYPE`, `ENTITY`, `SYSTEM` or `PUBLIC` are rejected before parsing.
