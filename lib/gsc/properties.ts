import { googleApiFetch } from "./client";
import { normalizeSiteUrl } from "./normalizers";
export type GscSite = { siteUrl: string; permissionLevel?: string; displayName?: string; propertyType?: string };
export async function listGscSites(accessToken: string): Promise<GscSite[]> { const data = await googleApiFetch<{ siteEntry?: Array<{ siteUrl: string; permissionLevel?: string }> }>("https://www.googleapis.com/webmasters/v3/sites", accessToken); return (data.siteEntry ?? []).map((site) => ({ siteUrl: normalizeSiteUrl(site.siteUrl), permissionLevel: site.permissionLevel, displayName: site.siteUrl.replace(/^sc-domain:/, ""), propertyType: site.siteUrl.startsWith("sc-domain:") ? "domain" : "url_prefix" })); }
