import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { normalizeShopDomain, isValidShopDomain, verifyShopifyOAuthHmac, buildShopifyOAuthMessage, encryptShopifyToken, decryptShopifyToken, mapShopifyProductToCatalogItem } from "../lib/shopify";
import { verifyShopifyWebhookHmac } from "../lib/shopify/hmac";

test("Shopify migration creates read/import tables and RLS", () => { const sql = fs.readFileSync("supabase/sql/021_shopify_foundation.sql", "utf8"); for (const table of ["shopify_stores", "shopify_oauth_states", "shopify_sync_runs", "shopify_products", "shopify_product_snapshots", "shopify_webhook_deliveries", "change_sets", "change_set_items"]) { assert.match(sql, new RegExp(`create table if not exists public\\.${table}`)); assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`)); } assert.match(sql, /SHOPIFY|shopify/); assert.match(sql, /optimization_proposal_versions add column if not exists ai_generation_run_id/); });

test("Shopify shop domains are strict myshopify domains", () => { assert.equal(normalizeShopDomain("Mi-Tienda.myshopify.com"), "mi-tienda.myshopify.com"); assert.equal(isValidShopDomain("https://evil.myshopify.com"), false); assert.equal(isValidShopDomain("evil.com"), false); assert.equal(isValidShopDomain("bad.myshopify.com/path"), false); });

test("Shopify OAuth and webhook HMAC verify valid signatures", async () => { const secret = "shpss_test_secret"; const params = new URLSearchParams({ shop: "store.myshopify.com", timestamp: String(Math.floor(Date.now() / 1000)), code: "abc" }); const hmac = crypto.createHmac("sha256", secret).update(buildShopifyOAuthMessage(params)).digest("hex"); params.set("hmac", hmac); assert.equal(verifyShopifyOAuthHmac(params, secret), true); params.set("hmac", "deadbeef"); assert.equal(verifyShopifyOAuthHmac(params, secret), false); const raw = JSON.stringify({ id: 1 }); const webhook = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("base64"); assert.equal(await verifyShopifyWebhookHmac(raw, webhook, secret), true); });

test("Shopify token encryption round-trips without plaintext", () => { process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64"); const encrypted = encryptShopifyToken("shpat_secret"); assert.equal(encrypted.includes("shpat_secret"), false); assert.equal(decryptShopifyToken(encrypted), "shpat_secret"); });

test("Shopify product maps to catalog item fields", () => { const item = mapShopifyProductToCatalogItem({ id: "gid://shopify/Product/1", title: "Bota S3", handle: "bota-s3", vendor: "WorkSafe", productType: "Calzado", onlineStoreUrl: "https://store/products/bota-s3", descriptionHtml: "<p>Protección</p>", seo: { title: "Bota SEO", description: "Meta" }, tags: ["s3"], images: { edges: [{ node: { id: "img", url: "https://img", altText: "Bota negra" } }] }, variants: { edges: [{ node: { id: "var", sku: "SKU1", title: "42", price: "79.90" } }] } }, "user-1"); assert.equal(item.platform, "shopify"); assert.equal(item.sku, "SKU1"); assert.equal(item.image_alt, "Bota negra"); assert.equal(item.brand, "WorkSafe"); });
