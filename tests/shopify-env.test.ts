import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Shopify env and scripts are documented", () => { const env = fs.readFileSync(".env.example", "utf8"); for (const key of ["SHOPIFY_ENABLED", "SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET", "SHOPIFY_TOKEN_ENCRYPTION_KEY", "SHOPIFY_WEBHOOK_SECRET", "SHOPIFY_WRITE_ENABLED"]) assert.match(env, new RegExp(key)); const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); assert.equal(pkg.scripts["sync:shopify"], "tsx scripts/sync-shopify.ts"); });
