import { validateAuditUrl } from "./url-validation";
import type { RobotsSitemapAudit, ValidatedAuditUrl } from "./types";

async function fetchText(url: string, maxBytes: number, timeoutMs: number) {
  await validateAuditUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: "no-store", headers: { "user-agent": "RankeliaBot/0.1 (+https://rankelia.ai)", accept: "text/plain,application/xml,text/xml,*/*;q=0.2" }, signal: controller.signal });
    if (!response.ok) return null;
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > maxBytes) return null;
    const text = await response.text();
    return text.length > maxBytes ? null : text;
  } catch { return null; }
  finally { clearTimeout(timer); }
}

export async function auditRobotsAndSitemap(validated: ValidatedAuditUrl): Promise<RobotsSitemapAudit> {
  const origin = `${validated.url.protocol}//${validated.url.host}`;
  const robotsUrl = `${origin}/robots.txt`;
  const warnings: string[] = [];
  const robots = await fetchText(robotsUrl, 512_000, 5000);
  const sitemapDeclarations = robots ? [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map((match) => match[1]) : [];
  const disallowAll = Boolean(robots?.match(/user-agent:\s*\*[^]*?disallow:\s*\/\s*(\n|$)/i));
  let sitemapUrl = sitemapDeclarations[0] ?? `${origin}/sitemap.xml`;
  let sitemap = await fetchText(sitemapUrl, 1_000_000, 5000);
  if (!sitemap && sitemapDeclarations.length > 1) {
    sitemapUrl = sitemapDeclarations[1];
    sitemap = await fetchText(sitemapUrl, 1_000_000, 5000);
  }
  if (!robots) warnings.push("No se pudo leer robots.txt o no existe.");
  if (!sitemap) warnings.push("No se detectó sitemap.xml básico.");
  const sitemapUrlCountEstimate = sitemap ? (sitemap.match(/<url\b/gi) ?? []).length + (sitemap.match(/<sitemap\b/gi) ?? []).length : 0;
  const lower = sitemap?.toLowerCase() ?? "";
  return { robotsTxtFound: Boolean(robots), robotsTxtUrl: robots ? robotsUrl : null, robotsDisallowAll: disallowAll, sitemapFound: Boolean(sitemap), sitemapUrl: sitemap ? sitemapUrl : null, sitemapDeclaredInRobots: sitemapDeclarations.length > 0, sitemapUrlCountEstimate, sitemapContainsProducts: /product|producto|products|productos|collection/.test(lower), sitemapContainsCategories: /categor|category|collection|collections/.test(lower), warnings };
}
