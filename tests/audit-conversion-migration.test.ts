import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("free audit conversion migration adds tokens, consent and events", () => {
  const sql = readFileSync("supabase/sql/018_free_audit_conversion_reports.sql", "utf8");
  for (const token of ["public_token_hash", "consent_email_report", "consent_marketing", "audit_report_events", "email_sent", "report_viewed", "cta_clicked"]) assert.match(sql, new RegExp(token));
});

test("import history migration records retryable import runs", () => {
  const sql = readFileSync("supabase/sql/019_import_history.sql", "utf8");
  for (const token of ["import_runs", "normalized_storage_path", "job_created", "previewed", "source_type"]) assert.match(sql, new RegExp(token));
});
