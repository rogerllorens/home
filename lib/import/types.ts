export type ImportSourceType = "csv" | "tsv" | "xlsx" | "xls" | "pasted_table" | "xml";
export type ImportWarning = { code: string; message: string; rowIndex?: number; field?: string };
export type ImportError = { code: string; message: string; rowIndex?: number; field?: string };
export type ImportedCatalogRow = { index: number; raw: Record<string, string>; normalized?: Record<string, unknown>; warnings: ImportWarning[]; errors: ImportError[] };
export type PlatformGuess = { platform: "shopify" | "woocommerce" | "prestashop" | "generic" | "unknown"; confidence: number; reasons: string[] };
export type MappingSuggestion = { field: string; label: string; required: boolean; selectedColumn: string | null; confidence: number; confidenceLabel: "high" | "medium" | "low" | "missing"; alternatives: Array<{ column: string; confidence: number; reason: string }>; reason: string };
export type ImportStats = { totalRows: number; validRows: number; invalidRows: number; totalColumns: number; truncatedCells: number; emptyRows: number };
export type ImportedCatalog = { sourceType: ImportSourceType; fileName?: string; sheetName?: string | null; encoding?: string | null; delimiter?: string | null; platformGuess?: PlatformGuess; headers: string[]; rows: ImportedCatalogRow[]; sampleRows: ImportedCatalogRow[]; mappingSuggestions: MappingSuggestion[]; stats: ImportStats; warnings: ImportWarning[]; errors: ImportError[] };
