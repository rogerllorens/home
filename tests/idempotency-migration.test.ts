import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("hardening migration defines idempotency and pending upload storage cleanup tables", () => {
  const sql = readFileSync("supabase/sql/014_hardening_idempotency_pending_uploads.sql", "utf8");
  assert.match(sql, /create table if not exists public\.idempotency_keys/i);
  assert.match(sql, /request_hash text/i);
  assert.match(sql, /create table if not exists public\.pending_uploads/i);
  assert.match(sql, /pending_uploads_status_check/i);
  assert.match(sql, /enable row level security/i);
});
