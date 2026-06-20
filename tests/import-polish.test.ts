import assert from "node:assert/strict";
import test from "node:test";
import { parseXmlCatalog } from "../lib/import/xml-importer";
import { removeEmptyRows, removeRowsWithoutColumn, trimAllRows } from "../components/app/import/BulkCorrectionPanel";

test("XML Merchant feed maps CDATA and repeated additional images", () => {
  const xml = "<rss><channel><item><g:id>SKU1</g:id><g:title><![CDATA[Zapato Trail]]></g:title><g:description>Ligero</g:description><g:link>https://example.com/zapato</g:link><g:image_link>https://example.com/1.jpg</g:image_link><g:additional_image_link>https://example.com/2.jpg</g:additional_image_link><g:additional_image_link>https://example.com/3.jpg</g:additional_image_link><g:brand>Marca</g:brand><g:price>49.90 EUR</g:price><g:product_type>Calzado &gt; Trail</g:product_type></item></channel></rss>";
  const catalog = parseXmlCatalog(xml);
  assert.equal(catalog.rows[0].raw.title, "Zapato Trail");
  assert.match(catalog.rows[0].raw.additional_image_link, /2.jpg; https:\/\/example.com\/3.jpg/);
  assert.equal(catalog.platformGuess?.platform, "generic");
});

test("bulk correction trims, removes empty rows and missing names", () => {
  const rows = [{ name: "  Producto   A  ", sku: " A1 " }, { name: " ", sku: "B2" }, { name: "", sku: "" }];
  const trimmed = trimAllRows(rows);
  assert.equal(trimmed[0].name, "Producto A");
  assert.equal(removeEmptyRows(trimmed).length, 2);
  assert.equal(removeRowsWithoutColumn(trimmed, "name").length, 1);
});
