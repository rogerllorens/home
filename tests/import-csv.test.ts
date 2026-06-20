import assert from "node:assert/strict";
import test from "node:test";
import { parseCsvText } from "../lib/import/csv-importer";

test("parsea CSV español con punto y coma", () => {
  const catalog = parseCsvText("nombre;descripción;categoría\nZapato;Cómodo;Calzado");
  assert.equal(catalog.delimiter, ";");
  assert.equal(catalog.rows[0].raw.descripción, "Cómodo");
});

test("parsea TSV y saltos de línea entre comillas", () => {
  const catalog = parseCsvText('sku\tnombre\tdescripción\nA1\t"Producto"\t"línea 1\nlínea 2"');
  assert.equal(catalog.delimiter, "\t");
  assert.equal(catalog.rows[0].raw.descripción, "línea 1\nlínea 2");
});

test("renombra headers duplicados y trunca celdas largas", () => {
  const long = "x".repeat(10050);
  const catalog = parseCsvText(`title,title,empty\nA,B,${long}`);
  assert.deepEqual(catalog.headers, ["title", "title_2", "empty"]);
  assert.equal(catalog.rows[0].raw.empty.length, 10000);
  assert.ok(catalog.warnings.some((warning) => warning.code === "duplicate_header"));
  assert.ok(catalog.rows[0].warnings.some((warning) => warning.code === "cell_truncated"));
});
