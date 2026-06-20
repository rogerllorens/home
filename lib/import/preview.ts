import { detectImportSourceType } from "./detect-file-type";
import { parseCsvBuffer } from "./csv-importer";
import { parseSpreadsheet, parseLegacyXls } from "./spreadsheet-importer";
import { decodeTextBuffer } from "./encoding";
import { parseXmlCatalog } from "./xml-importer";
import { assertImportFileSize } from "./limits";
export async function parseImportPreview(input: { buffer: ArrayBuffer | Uint8Array; fileName: string; mime?: string; sheetId?: string }) { const bytes = input.buffer instanceof Uint8Array ? input.buffer : new Uint8Array(input.buffer); assertImportFileSize(bytes.byteLength); const type = detectImportSourceType(input.fileName, input.mime); if (type === "csv" || type === "tsv") return parseCsvBuffer(bytes, { fileName: input.fileName, sourceType: type }); if (type === "xlsx") return parseSpreadsheet(bytes, { fileName: input.fileName, sheetId: input.sheetId }); if (type === "xls") return parseLegacyXls(); if (type === "xml") { const decoded = decodeTextBuffer(bytes); const catalog = parseXmlCatalog(decoded.text, { fileName: input.fileName }); return { ...catalog, encoding: decoded.encoding, warnings: [...decoded.warnings, ...catalog.warnings] }; } throw new Error("Formato no soportado. Usa CSV, TSV, XLSX, XML básico o pega una tabla."); }
