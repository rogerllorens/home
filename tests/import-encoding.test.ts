import assert from "node:assert/strict";
import test from "node:test";
import { decodeTextBuffer } from "../lib/import/encoding";

test("detecta UTF-8 con BOM", () => {
  const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...Buffer.from("Descripción,Categoría", "utf8")]);
  const decoded = decodeTextBuffer(bytes);
  assert.equal(decoded.encoding, "utf-8-bom");
  assert.equal(decoded.text, "Descripción,Categoría");
});

test("convierte Windows-1252 con acentos españoles", () => {
  const bytes = Uint8Array.from([0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x63, 0x69, 0xf3, 0x6e, 0x2c, 0x43, 0x61, 0x74, 0x65, 0x67, 0x6f, 0x72, 0xed, 0x61, 0x2c, 0x4e, 0x69, 0xf1, 0x6f, 0x2c, 0x54, 0x61, 0x6d, 0x61, 0xf1, 0x6f]);
  const decoded = decodeTextBuffer(bytes);
  assert.equal(decoded.encoding, "windows-1252");
  assert.equal(decoded.text, "Descripción,Categoría,Niño,Tamaño");
  assert.ok(decoded.warnings.some((warning) => warning.code === "encoding_windows_1252"));
});
