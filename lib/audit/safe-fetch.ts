import { validateAuditUrl } from "./url-validation";
import type { SafeFetchResult, ValidatedAuditUrl } from "./types";

const USER_AGENT = "RankeliaBot/0.1 (+https://rankelia.ai)";

async function readLimited(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) throw new Error("too_large");
    return buffer.toString("utf8");
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) throw new Error("too_large");
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks, total).toString("utf8");
}

export async function safeFetchHtml(validated: ValidatedAuditUrl, options: { timeoutMs?: number; maxRedirects?: number; maxBytes?: number } = {}): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? Number(process.env.FREE_AUDIT_TIMEOUT_MS ?? 9000);
  const maxRedirects = options.maxRedirects ?? Number(process.env.FREE_AUDIT_MAX_REDIRECTS ?? 3);
  const maxBytes = options.maxBytes ?? Number(process.env.FREE_AUDIT_MAX_BYTES ?? 2_000_000);
  const started = Date.now();
  let current = validated.normalizedUrl;
  let redirects = 0;
  const headers: Record<string, string> = {};
  try {
    for (;;) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.2" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));
      response.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });
      if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
        redirects += 1;
        if (redirects > maxRedirects) throw new Error("redirect_loop");
        const next = new URL(response.headers.get("location") ?? "", current).toString();
        const safe = await validateAuditUrl(next);
        current = safe.normalizedUrl;
        continue;
      }
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) throw new Error("non_html");
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > maxBytes) throw new Error("too_large");
      const html = await readLimited(response, maxBytes);
      return { ok: response.ok, httpStatus: response.status, finalUrl: current, redirectCount: redirects, fetchTimeMs: Date.now() - started, html, htmlSizeBytes: Buffer.byteLength(html), headers };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch_failed";
    const code = message === "too_large" || message === "non_html" || message === "redirect_loop" ? message : message.includes("aborted") ? "fetch_timeout" : message.includes("privada") || message.includes("bloque") ? "blocked_url" : "fetch_failed";
    return { ok: false, redirectCount: redirects, fetchTimeMs: Date.now() - started, headers, errorCode: code, errorMessage: code === "fetch_failed" ? "No se pudo leer el HTML público de la URL." : message };
  }
}
