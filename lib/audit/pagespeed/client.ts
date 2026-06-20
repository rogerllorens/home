import type { PageSpeedStrategy } from "./types";

export function isPageSpeedEnabled() { return process.env.PAGESPEED_ENABLED !== "false"; }
export function hasPageSpeedKey() { return Boolean(process.env.PAGESPEED_API_KEY); }

export async function fetchPageSpeed(url: string, strategy: PageSpeedStrategy, options: { timeoutMs?: number; fetchImpl?: typeof fetch } = {}) {
  if (!isPageSpeedEnabled()) return { status: "skipped" as const, errorMessage: "PageSpeed disabled" };
  if (!hasPageSpeedKey()) return { status: "skipped" as const, errorMessage: "PageSpeed API key not configured" };
  const timeoutMs = options.timeoutMs ?? Number(process.env.PAGESPEED_TIMEOUT_MS ?? 45000);
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  for (const category of ["performance", "seo", "best-practices", "accessibility"]) endpoint.searchParams.append("category", category);
  endpoint.searchParams.set("key", process.env.PAGESPEED_API_KEY ?? "");
  const controller = new AbortController();
  const started = Date.now();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const doFetch = options.fetchImpl ?? fetch;
    const response = await doFetch(endpoint.toString(), { cache: "no-store", signal: controller.signal });
    if (response.status === 429) return { status: "rate_limited" as const, errorMessage: "PageSpeed quota exceeded", psiFetchTimeMs: Date.now() - started };
    if (!response.ok) return { status: "failed" as const, errorMessage: `PageSpeed HTTP ${response.status}`, psiFetchTimeMs: Date.now() - started };
    return { status: "completed" as const, data: await response.json(), psiFetchTimeMs: Date.now() - started };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return { status: "failed" as const, errorMessage: aborted ? "PageSpeed timeout" : "PageSpeed request failed", psiFetchTimeMs: Date.now() - started };
  } finally { clearTimeout(timer); }
}
