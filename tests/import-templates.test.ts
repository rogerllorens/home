import assert from "node:assert/strict";
import test from "node:test";
import { buildTemplateCsv, importTemplates } from "../lib/import/templates";

test("plantillas descargables tienen headers mínimos y BOM", () => {
  const template = buildTemplateCsv("generic");
  assert.ok(template.csv.startsWith("\uFEFF"));
  assert.ok(template.headers.includes("product_name"));
  assert.ok(template.headers.includes("meta_description"));
});

test("plantillas de plataforma existen", () => {
  assert.ok(importTemplates.shopify.headers.includes("Handle"));
  assert.ok(importTemplates.woocommerce.headers.includes("SKU"));
  assert.ok(importTemplates.prestashop.headers.includes("Reference"));
});
