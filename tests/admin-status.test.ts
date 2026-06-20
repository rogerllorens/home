import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("admin status endpoint releases active reservations on terminal states", () => {
  const route = readFileSync("app/api/admin/jobs/[id]/status/route.ts", "utf8");
  assert.match(route, /release_reserved_credits/);
  assert.match(route, /body\.status === "failed" \|\| body\.status === "cancelled"/);
  assert.match(route, /Job requeued by admin without an active reservation/);
});
