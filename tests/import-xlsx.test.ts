import assert from "node:assert/strict";
import test from "node:test";
import { zipSync, strToU8 } from "fflate";
import { listWorkbookSheets, parseSpreadsheet, parseLegacyXls } from "../lib/import/spreadsheet-importer";

function workbook(): Uint8Array {
  return zipSync({
    "[Content_Types].xml": strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>'),
    "xl/workbook.xml": strToU8('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Productos" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    "xl/sharedStrings.xml": strToU8('<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>nombre</t></si><si><t>sku</t></si><si><t>Taladro</t></si><si><t>T-1</t></si></sst>'),
    "xl/worksheets/sheet1.xml": strToU8('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="s"><v>3</v></c></row><row r="3"><c r="A3"><f>SUM(1,2)</f><v>3</v></c><c r="B3"><v>4</v></c></row></sheetData></worksheet>')
  });
}

test("lista hojas y parsea XLSX simple sin ejecutar fórmulas", () => {
  const buffer = workbook();
  const sheets = listWorkbookSheets(buffer);
  assert.equal(sheets[0].name, "Productos");
  const catalog = parseSpreadsheet(buffer);
  assert.equal(catalog.sourceType, "xlsx");
  assert.equal(catalog.rows[0].raw.nombre, "Taladro");
  assert.equal(catalog.rows[1].raw.nombre, "3");
});

test("XLS legacy se rechaza con error claro", () => {
  assert.throws(() => parseLegacyXls(), /XLS binario legacy/);
});
