import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { rateLimit } from "../lib/rate-limit";

test("production job hardening allows reservation states and blocks direct customer writes", async () => {
  const sql = readFileSync("supabase/sql/008_production_job_creation_hardening.sql", "utf8");
  assert.match(sql, /pending_reservation/);
  assert.match(sql, /insufficient_credits/);
  assert.match(sql, /completed_with_warnings/);
  assert.match(sql, /revoke insert, update, delete on public\.jobs from authenticated/i);
  assert.match(sql, /revoke insert, update, delete on public\.job_rows from authenticated/i);
  assert.match(sql, /credit_reservations_one_reserved_per_job_idx/);

  const one = await rateLimit("test-job-security", 1, 60);
  const two = await rateLimit("test-job-security", 1, 60);
  assert.equal(one.allowed, true);
  assert.equal(two.allowed, false);
});
