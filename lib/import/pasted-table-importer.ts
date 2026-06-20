import { IMPORT_LIMITS } from "./limits";
import { parseCsvText } from "./csv-importer";
export function parsePastedTable(text: string) { if (text.length > IMPORT_LIMITS.maxPastedChars) throw new Error("La tabla pegada es demasiado grande."); const delimiter = text.includes("\t") ? "\t" : text.includes(";") ? ";" : text.includes("|") ? "|" : ","; return parseCsvText(text, { sourceType: "pasted_table", delimiter, fileName: "tabla-pegada-rankelia.csv" }); }
