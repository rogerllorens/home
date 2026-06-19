import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("public copy avoids unsupported guarantees and marks GSC as upcoming", () => {
  const files = ["components/landing/PublicLanding.tsx", "app/search-console/page.tsx", "app/producto/page.tsx"].map((file) => fs.readFileSync(file, "utf8")).join("\n").toLowerCase();
  for (const claim of ["ranking garantizado", "publicación automática garantizada", "importación garantizada"]) assert.equal(files.includes(claim), false);
  assert.ok(files.includes("próximamente"));
});
