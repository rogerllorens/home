import crypto from "node:crypto";
import { getShopifyConfig } from "./config";
import { normalizeShopDomain } from "./shop-domain";
import { getReadScopes } from "./scopes";
export function createShopifyState() { return crypto.randomBytes(24).toString("base64url"); }
export function buildShopifyOAuthUrl(shopInput: string, state: string, mode: "read" | "write_upgrade" = "read") { const shop = normalizeShopDomain(shopInput); const config = getShopifyConfig(); const scopes = mode === "read" ? getReadScopes() : [...getReadScopes(), ...config.optionalWriteScopes.split(",")].filter(Boolean); const redirectUri = `${config.appUrl.replace(/\/$/, "")}/api/integrations/shopify/callback`; const url = new URL(`https://${shop}/admin/oauth/authorize`); url.searchParams.set("client_id", config.clientId); url.searchParams.set("scope", scopes.join(",")); url.searchParams.set("redirect_uri", redirectUri); url.searchParams.set("state", state); return url.toString(); }
export async function exchangeShopifyCode(shop: string, code: string) { const config = getShopifyConfig(); const response = await fetch(`https://${normalizeShopDomain(shop)}/admin/oauth/access_token`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code }) }); if (!response.ok) throw new Error("shopify_token_exchange_failed"); return await response.json() as { access_token: string; scope?: string };
}
