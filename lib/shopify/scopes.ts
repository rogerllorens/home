import { getShopifyConfig, isShopifyWriteEnabled } from "./config";
export function getReadScopes() { return getShopifyConfig().readScopes.split(",").map((s) => s.trim()).filter(Boolean); }
export function getOptionalWriteScopes() { return isShopifyWriteEnabled() ? getShopifyConfig().optionalWriteScopes.split(",").map((s) => s.trim()).filter(Boolean) : []; }
export function hasScope(granted: unknown, scope: string) { const scopes = Array.isArray(granted) ? granted : typeof granted === "string" ? granted.split(",") : []; return scopes.map(String).includes(scope); }
