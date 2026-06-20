import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getShopifyFieldPolicy, validateChangeSetFields, buildProposedShopifyChanges } from "../lib/shopify";

test("Shopify field policy allows only safe SEO fields by default", () => {
  assert.equal(getShopifyFieldPolicy("seo.title").kind, "allowed");
  assert.equal(getShopifyFieldPolicy("seo.description").kind, "allowed");
  assert.equal(getShopifyFieldPolicy("descriptionHtml").kind, "allowed");
  assert.equal(getShopifyFieldPolicy("images.altText").kind, "allowed");
  assert.equal(getShopifyFieldPolicy("title").kind, "dangerous");
  assert.equal(getShopifyFieldPolicy("handle").kind, "dangerous");
});

test("Shopify field policy rejects forbidden commerce fields", () => {
  const result = validateChangeSetFields(["seo.title", "variants.price", "inventory", "vendor", "status"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers.map((blocker) => blocker.kind), ["forbidden", "forbidden", "forbidden", "forbidden"]);
});

test("Shopify change builder maps approved proposal output to Shopify fields", () => {
  const changes = buildProposedShopifyChanges({ meta_title: "Nuevo title", meta_description: "Nueva desc", long_description: "HTML seguro" }, ["seo.title", "seo.description", "descriptionHtml"]);
  assert.deepEqual(changes, [
    { fieldPath: "seo.title", proposedValue: "Nuevo title" },
    { fieldPath: "seo.description", proposedValue: "Nueva desc" },
    { fieldPath: "descriptionHtml", proposedValue: "HTML seguro" },
  ]);
});

test("Shopify apply rollback migration creates gated run tables and RLS", () => {
  const sql = readFileSync("supabase/sql/022_shopify_apply_rollback.sql", "utf8");
  for (const table of ["shopify_dry_runs", "shopify_apply_runs", "shopify_apply_run_items", "shopify_rollback_runs", "shopify_rollback_run_items"]) {
    assert.match(sql, new RegExp(`create table if not exists (public\\.)?${table}`));
    assert.match(sql, new RegExp(`alter table (public\\.)?${table} enable row level security`));
  }
  assert.match(sql, /write_scope_required boolean not null default true/);
  assert.match(sql, /rollback_available boolean not null default false/);
  assert.match(sql, /idempotency_key text null/);
});

test("Shopify apply and smoke scripts are wired in package scripts", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["apply:shopify"], "tsx scripts/apply-shopify-change-set.ts");
  assert.equal(pkg.scripts["rollback:shopify"], "tsx scripts/rollback-shopify-apply-run.ts");
  assert.equal(pkg.scripts["smoke:shopify"], "tsx scripts/smoke-shopify.ts");
  assert.equal(pkg.scripts["smoke:stripe"], "tsx scripts/smoke-stripe.ts");
  assert.equal(pkg.scripts["smoke:storage"], "tsx scripts/smoke-storage.ts");
  assert.equal(pkg.scripts["smoke:worker"], "tsx scripts/smoke-worker.ts");
});

test("Shopify apply worker is gated by write feature flag and exact confirmations", () => {
  const applyScript = readFileSync("scripts/apply-shopify-change-set.ts", "utf8");
  const applyLib = readFileSync("lib/shopify/apply.ts", "utf8");
  const rollbackLib = readFileSync("lib/shopify/rollback.ts", "utf8");
  assert.match(applyScript, /SHOPIFY_WRITE_ENABLED !== "true"/);
  assert.match(applyLib, /APLICAR CAMBIOS/);
  assert.match(rollbackLib, /REVERTIR CAMBIOS/);
  assert.match(applyLib, /write_products/);
});

test("Prompt 9 Shopify closure blocks apply without live verification and image ALT flag", () => {
  const migration = readFileSync("supabase/sql/023_launch_closure_safety.sql", "utf8");
  const dryRun = readFileSync("lib/shopify/dry-run.ts", "utf8");
  const apply = readFileSync("lib/shopify/apply.ts", "utf8");
  const mutations = readFileSync("lib/shopify/mutations.ts", "utf8");
  assert.match(migration, /live_check_status/);
  assert.match(migration, /needs_resync/);
  assert.match(dryRun, /fetchLiveShopifyProduct/);
  assert.match(dryRun, /live_check_status/);
  assert.match(apply, /live_check_status", "verified"/);
  assert.match(apply, /live_value_changed_before_apply/);
  assert.match(mutations, /SHOPIFY_IMAGE_ALT_WRITE_ENABLED/);
  assert.match(mutations, /shopify_image_alt_write_not_validated/);
});

test("RLS smoke script is wired and skips without staging users", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const script = readFileSync("scripts/smoke-rls.ts", "utf8");
  assert.equal(pkg.scripts["smoke:rls"], "tsx scripts/smoke-rls.ts");
  assert.match(script, /RLS_SMOKE_USER_A_ID/);
  assert.match(script, /SKIP: missing RLS smoke env/);
});
