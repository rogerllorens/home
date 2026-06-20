# Encoding

Rankelia decodes text imports with this order:

1. UTF-8 BOM detection.
2. Strict UTF-8 decoding.
3. Windows-1252 fallback.
4. Latin-1 fallback.

This prevents common Spanish/LatAm Excel CSV issues where `Descripción`, `Categoría`, `Niño` or `Tamaño` are corrupted when files are treated as UTF-8 incorrectly.
