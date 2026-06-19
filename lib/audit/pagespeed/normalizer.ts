import crypto from "node:crypto";
import type { NormalizedPageSpeedResult, PageSpeedOpportunity, PageSpeedStrategy } from "./types";

const score = (value: unknown) => typeof value === "number" ? Math.round(value * 100) : null;
const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
const rawNum = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const audit = (audits: Record<string, unknown>, id: string) => (audits[id] ?? {}) as Record<string, unknown>;
const details = (item: Record<string, unknown>) => (typeof item.details === "object" && item.details ? item.details as Record<string, unknown> : {});
const savingsMs = (item: Record<string, unknown>) => num(details(item).overallSavingsMs ?? item.numericValue);
const savingsBytes = (item: Record<string, unknown>) => num(details(item).overallSavingsBytes ?? details(item).overallSavingsBytesWasted ?? item.numericValue);

function severity(item: Record<string, unknown>): PageSpeedOpportunity["severity"] {
  const scoreValue = typeof item.score === "number" ? item.score : 1;
  const numeric = typeof item.numericValue === "number" ? item.numericValue : 0;
  if (scoreValue < 0.35 || numeric > 2500) return "critical";
  if (scoreValue < 0.75 || numeric > 800) return "warning";
  return "opportunity";
}

function recommendation(id: string) {
  if (id.includes("render-blocking")) return "Revisa CSS/JS crítico y difiere scripts no esenciales.";
  if (id.includes("unused-javascript")) return "Reduce apps, bundles y scripts de terceros que bloquean interacción.";
  if (id.includes("unused-css")) return "Elimina CSS no usado y carga estilos críticos primero.";
  if (id.includes("image") || id.includes("offscreen")) return "Usa WebP/AVIF, tamaños adecuados y lazy loading para imágenes no críticas.";
  if (id.includes("server-response")) return "Revisa caché, hosting, CDN y tiempo de respuesta del servidor.";
  if (id.includes("third-party")) return "Audita trackers, widgets y apps externas que afecten la carga.";
  return "Prioriza esta mejora con tu equipo técnico o proveedor ecommerce.";
}

function opportunity(audits: Record<string, unknown>, id: string): PageSpeedOpportunity | null {
  const item = audit(audits, id);
  if (!item.title) return null;
  const ms = savingsMs(item);
  const bytes = savingsBytes(item);
  if (!ms && !bytes && typeof item.score === "number" && item.score >= 0.9) return null;
  return { id, title: String(item.title), description: String(item.description ?? ""), displayValue: typeof item.displayValue === "string" ? item.displayValue : undefined, numericValue: rawNum(item.numericValue) ?? undefined, estimatedSavingsMs: ms ?? undefined, estimatedSavingsBytes: bytes ?? undefined, severity: severity(item), recommendation: recommendation(id) };
}

export function buildPageSpeedCacheKey(url: string, strategy: PageSpeedStrategy) {
  return crypto.createHash("sha256").update(`psi:v1:${strategy}:${url}`).digest("hex");
}

function record(value: unknown): Record<string, unknown> { return typeof value === "object" && value !== null ? value as Record<string, unknown> : {}; }
export function normalizePageSpeedResponse(raw: unknown, strategy: PageSpeedStrategy, url: string, psiFetchTimeMs?: number, ttlHours = Number(process.env.PAGESPEED_CACHE_TTL_HOURS ?? 24)): NormalizedPageSpeedResult {
  const root = record(raw);
  const lighthouse = record(root.lighthouseResult);
  const audits = record(lighthouse.audits);
  const categories = record(lighthouse.categories);
  const opportunityIds = ["render-blocking-resources", "unused-javascript", "unused-css-rules", "uses-optimized-images", "uses-webp-images", "efficient-animated-content", "offscreen-images", "server-response-time", "redirects", "uses-text-compression", "uses-rel-preload", "third-party-summary", "mainthread-work-breakdown", "bootup-time", "dom-size"];
  const opportunities = opportunityIds.map((id) => opportunity(audits, id)).filter(Boolean) as PageSpeedOpportunity[];
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  return {
    strategy, status: "completed", psiFetchTimeMs, lighthouseVersion: typeof lighthouse.lighthouseVersion === "string" ? lighthouse.lighthouseVersion : undefined,
    performanceScore: score(record(categories.performance).score), accessibilityScore: score(record(categories.accessibility).score), bestPracticesScore: score(record(categories["best-practices"]).score), seoScore: score(record(categories.seo).score), pwaScore: score(record(categories.pwa).score),
    firstContentfulPaintMs: num(audit(audits, "first-contentful-paint").numericValue), largestContentfulPaintMs: num(audit(audits, "largest-contentful-paint").numericValue), totalBlockingTimeMs: num(audit(audits, "total-blocking-time").numericValue), cumulativeLayoutShift: rawNum(audit(audits, "cumulative-layout-shift").numericValue), speedIndexMs: num(audit(audits, "speed-index").numericValue), interactionToNextPaintMs: num(audit(audits, "interaction-to-next-paint").numericValue), timeToInteractiveMs: num(audit(audits, "interactive").numericValue), serverResponseTimeMs: num(audit(audits, "server-response-time").numericValue),
    renderBlockingSavingsMs: opportunity(audits, "render-blocking-resources")?.estimatedSavingsMs ?? null, unusedJsSavingsBytes: opportunity(audits, "unused-javascript")?.estimatedSavingsBytes ?? null, unusedCssSavingsBytes: opportunity(audits, "unused-css-rules")?.estimatedSavingsBytes ?? null, imageOptimizationSavingsBytes: opportunity(audits, "uses-optimized-images")?.estimatedSavingsBytes ?? opportunity(audits, "offscreen-images")?.estimatedSavingsBytes ?? null, modernImageSavingsBytes: opportunity(audits, "uses-webp-images")?.estimatedSavingsBytes ?? null, domSize: num(audit(audits, "dom-size").numericValue),
    fieldData: record(root.loadingExperience), labData: { fcp: audit(audits, "first-contentful-paint").displayValue, lcp: audit(audits, "largest-contentful-paint").displayValue, tbt: audit(audits, "total-blocking-time").displayValue, cls: audit(audits, "cumulative-layout-shift").displayValue }, opportunities, diagnostics: opportunities.filter((item) => ["third-party-summary", "mainthread-work-breakdown", "bootup-time", "dom-size"].includes(item.id)), rawSummary: { finalUrl: lighthouse.finalUrl, fetchTime: lighthouse.fetchTime, requestedUrl: lighthouse.requestedUrl }, cacheKey: buildPageSpeedCacheKey(url, strategy), expiresAt,
  };
}
