import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("proposal migration creates catalog, proposal, version and event tables with RLS", () => {
  const sql = readFileSync("supabase/sql/015_optimization_proposals_versions.sql", "utf8");
  assert.match(sql, /create table if not exists public\.catalog_items/i);
  assert.match(sql, /create table if not exists public\.optimization_proposals/i);
  assert.match(sql, /create table if not exists public\.optimization_proposal_versions/i);
  assert.match(sql, /create table if not exists public\.proposal_events/i);
  assert.match(sql, /active_version_id uuid/i);
  assert.match(sql, /approved_version_id uuid/i);
  assert.match(sql, /alter table public\.job_rows[\s\S]*add column if not exists proposal_id/i);
  assert.match(sql, /enable row level security/i);
});
