import assert from "node:assert/strict";
import test from "node:test";
import { parseXmlCatalog } from "../lib/import/xml-importer";

test("parsea XML básico de productos", () => {
  const catalog = parseXmlCatalog("<products><product><name>Taladro</name><sku>T-1</sku><category>Herramientas</category></product></products>");
  assert.equal(catalog.sourceType, "xml");
  assert.equal(catalog.rows[0].raw.name, "Taladro");
});

test("parsea RSS y namespaces tipo Merchant", () => {
  const catalog = parseXmlCatalog("<rss><channel><item><g:title>Zapato</g:title><g:description>Cómodo</g:description></item></channel></rss>");
  assert.equal(catalog.rows[0].raw.title, "Zapato");
  assert.equal(catalog.rows[0].raw.description, "Cómodo");
});

test("bloquea DOCTYPE y ENTITY", () => {
  assert.throws(() => parseXmlCatalog('<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><products />'), /DOCTYPE/);
  assert.throws(() => parseXmlCatalog('<!ENTITY lol "lol"><products />'), /ENTITY/);
});
