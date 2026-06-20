import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
test("smoke scripts skip clearly without real env", () => {
  assert.match(readFileSync("scripts/smoke-resend.ts", "utf8"), /skipped/);
  assert.match(readFileSync("scripts/smoke-gsc.ts", "utf8"), /skipped/);
});
