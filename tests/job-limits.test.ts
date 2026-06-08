import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("job creation enforces concurrent job limits before reservation", () => {
  const route = readFileSync("app/api/jobs/create/route.ts", "utf8");
  assert.match(route, /maxConcurrentJobs/);
  assert.match(route, /pending_reservation/);
  assert.match(route, /ready_for_processing/);
  assert.match(route, /reserve_credits/);
  assert.ok(route.indexOf("maxConcurrentJobs") < route.indexOf("reserve_credits"));
});
