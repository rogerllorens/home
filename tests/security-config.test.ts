import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("final SQL hardening blocks customer role escalation and wallet writes", () => {
  const sql = readFileSync("supabase/sql/007_final_security_hardening.sql", "utf8");
  assert.match(sql, /prevent_profile_role_escalation/);
  assert.match(sql, /role_updates_admin_only/);
  assert.match(sql, /revoke insert, update, delete on public\.credit_wallets from authenticated/i);
  assert.match(sql, /revoke insert, update, delete on public\.downloads from authenticated/i);
  const sql8 = readFileSync("supabase/sql/008_production_job_creation_hardening.sql", "utf8");
  assert.match(sql8, /audit_events/);
});


test("original signed URL route validates job ownership before signing", () => {
  const route = readFileSync("app/api/jobs/[id]/original/signed-url/route.ts", "utf8");
  const realJobs = readFileSync("components/app/real/RealJobsPage.tsx", "utf8");
  assert.match(route, /getCurrentUserContext/);
  assert.match(route, /isAdminRole/);
  assert.match(route, /validateStoragePathOwnership\(job\.user_id, job\.input_file_path\)/);
  assert.match(route, /INPUT_BUCKETS/);
  assert.doesNotMatch(realJobs, /getSignedDownloadUrl/);
  assert.match(realJobs, /\/api\/jobs\/\$\{job\.id\}\/original\/signed-url/);
});
