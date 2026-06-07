import assert from "node:assert/strict";
import test from "node:test";
import { parseCSV, autoMapColumns, analyzeCSVRows } from "../lib/csv";
import { sanitizeFilename, buildInputFilePath, validateStoragePathOwnership } from "../lib/storage/files";

test("CSV parser maps ecommerce headers and detects valid rows", () => {
  const parsed = parseCSV("sku,nombre_producto,marca,categoria\nA1,Bota S3,WorkSafe,Calzado\n");
  const mapping = autoMapColumns(parsed.headers);
  const summary = analyzeCSVRows(parsed.rows, mapping, { generationType: "Producto completo" });
  assert.equal(parsed.rows.length, 1);
  assert.equal(mapping.nombre_producto, "nombre_producto");
  assert.equal(summary.validRows, 1);
});

test("storage paths are sanitized and user-scoped", () => {
  assert.equal(sanitizeFilename("Catálogo verano 2026!.csv"), "Catalogo-verano-2026-.csv");
  const path = buildInputFilePath("user-1", "job-1", "../malicioso.csv");
  assert.equal(path, "user-1/job-1/malicioso.csv");
  assert.equal(validateStoragePathOwnership("user-1", path), true);
  assert.equal(validateStoragePathOwnership("user-1", "user-1/job-1/output.csv"), true);
  assert.equal(validateStoragePathOwnership("user-1", "user-2/job-1/output.csv"), false);
});
