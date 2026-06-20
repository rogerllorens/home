import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const sql = readFileSync("supabase/sql/016_gsc_integration.sql", "utf8");
test("GSC migration creates private metric tables with RLS", () => { for (const table of ["gsc_connections", "gsc_oauth_states", "gsc_properties", "gsc_sync_runs", "gsc_url_metrics", "gsc_query_metrics", "gsc_page_query_metrics", "gsc_catalog_matches"]) { assert.match(sql, new RegExp(`create table if not exists (public\.)?${table}`)); assert.match(sql, new RegExp(`alter table (public\.)?${table} enable row level security`)); } });
test("GSC migration stores encrypted tokens and readonly metrics", () => { assert.match(sql, /access_token_encrypted/); assert.match(sql, /refresh_token_encrypted/); assert.match(sql, /clicks integer/); assert.match(sql, /impressions integer/); assert.match(sql, /unique \(property_id, date_range, normalized_url, normalized_query, start_date, end_date\)/); });
