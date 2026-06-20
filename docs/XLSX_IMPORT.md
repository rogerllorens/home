# XLSX Import

XLSX files are parsed server/client-side with strict size and sheet limits. Rankelia reads worksheet values and shared strings, lists workbook sheets, treats formulas as stored values/text and never executes macros or formulas.

Legacy binary `.xls` is detected and rejected with a clear safe error in this iteration. Users should save as `.xlsx`, upload CSV or paste the table.
