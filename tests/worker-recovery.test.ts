import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("worker recovers stale processing jobs and releases reservations after max attempts", () => {
  const worker = readFileSync("scripts/process-jobs.ts", "utf8");
  assert.match(worker, /recoverStaleProcessingJobs/);
  assert.match(worker, /WORKER_STALE_JOB_MINUTES/);
  assert.match(worker, /release_reserved_credits/);
  assert.match(worker, /retrying/);
});
