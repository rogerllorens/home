async function main() {
  if (process.env.SHOPIFY_ENABLED !== "true") { console.log("SKIP: SHOPIFY_ENABLED=false; no Shopify smoke executed."); return; }
  const required = ["SHOPIFY_APP_URL", "SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET", "SHOPIFY_TOKEN_ENCRYPTION_KEY", "SHOPIFY_WEBHOOK_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) { console.log(`SKIP: missing Shopify env: ${missing.join(", ")}`); return; }
  if (!process.env.SHOPIFY_SMOKE_STORE_ID) { console.log("SKIP: set SHOPIFY_SMOKE_STORE_ID for connected-store smoke."); return; }
  console.log("READY: Shopify env present. Run sync:shopify -- --dry-run --store-id=$SHOPIFY_SMOKE_STORE_ID with a test user/run in production smoke.");
  if (process.env.SHOPIFY_WRITE_ENABLED === "true" && process.env.ALLOW_SHOPIFY_SMOKE_WRITE === "true" && process.env.SHOPIFY_SMOKE_TEST_PRODUCT_GID) console.log("READY: write smoke explicitly allowed for one test product; execute apply+rollback run after creating a fixture change set.");
}
main().catch((error) => { console.error(error); process.exit(1); });

export {};
