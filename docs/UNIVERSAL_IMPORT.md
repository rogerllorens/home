# Universal Import

Rankelia accepts catalog data from improved CSV/TSV, UTF-8 BOM, Windows-1252/Latin-1 CSV, XLSX spreadsheets, pasted tables and basic product XML. Every source is normalized into an internal UTF-8 CSV before creating the existing job, so proposals, versions, Image SEO, GSC matching, opportunities and approved exports continue using the same processing path.

Supported upload flow:
1. Upload a file or paste a table in `/app/upload`.
2. Rankelia detects type, delimiter, encoding, spreadsheet sheet, platform and column mapping confidence.
3. The user reviews mapping and row validation.
4. Rankelia uploads a normalized CSV to private Storage and calls `/api/jobs/create` with import metadata.

Limits are intentionally conservative: 10 MB files, 150 columns, 10,000 characters per cell, 25 XLSX sheets, 50,000 XML nodes, XML depth 12 and 2,000,000 pasted characters.

Security: Rankelia does not execute macros, does not evaluate formulas, blocks XML DOCTYPE/ENTITY, does not fetch URLs from imported content and keeps CSV injection protections for exports.

## Prompt 5 polish

Prompt 5 adds reusable sheet-selection UI, safe bulk correction helpers and an `import_runs` history table. Legacy `.xls` remains a safe rejection. XML feed parsing now handles CDATA and repeated Merchant-style image fields more gracefully.

## Prompt 6 polish

`SpreadsheetSheetSelector` is now wired into upload state for XLSX sheets returned by the parser, and `BulkCorrectionPanel` can trim/normalize rows or remove empty/missing-name rows before job creation. `import_runs` has list/detail/retry API foundations; the complete retry UX can build on these endpoints.
