import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { validateAuditUrl } from "./url-validation";
import type { SafeFetchResult, ValidatedAuditUrl } from "./types";

const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;
const HTML_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];

type PinnedLookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | { address: string; family: 4 | 6 }[],
  family?: number,
) => void;

export function createPinnedLookup(ip: string, family: 4 | 6) {
  return (_hostname: string, options: unknown, callback: PinnedLookupCallback) => {
    if (typeof options === "object" && options && "all" in options && options.all) {
      callback(null, [{ address: ip, family }]);
      return;
    }
    callback(null, ip, family);
  };
}

function isHtmlContentType(contentType: string | undefined) {
  if (!contentType) return false;
  return HTML_CONTENT_TYPES.some((type) => contentType.toLowerCase().includes(type));
}

function resolveRedirect(current: URL, location: string | string[] | undefined) {
  if (!location || Array.isArray(location)) return null;
  return new URL(location, current).toString();
}

async function requestPinned(validated: ValidatedAuditUrl): Promise<{
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  truncated: boolean;
}> {
  const target = validated.url;
  const transport = target.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;
    let truncated = false;

    const request = transport.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method: "GET",
        headers: {
          "user-agent": "RankeliaAuditBot/1.0 (+https://rankelia.ai)",
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
          host: target.host,
        },
        lookup: createPinnedLookup(validated.resolvedIp, validated.resolvedFamily),
        servername: target.hostname,
        timeout: TIMEOUT_MS,
      },
      (response) => {
        response.on("data", (chunk: Buffer) => {
          if (truncated) return;
          received += chunk.length;
          if (received > MAX_BYTES) {
            truncated = true;
            request.destroy();
            return;
          }
          chunks.push(chunk);
        });

        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
            truncated,
          });
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("fetch_timeout"));
    });

    request.on("error", (error) => {
      if (truncated) {
        resolve({ status: 0, headers: {}, body: Buffer.concat(chunks).toString("utf8"), truncated });
        return;
      }
      reject(error);
    });

    request.end();
  });
}

function toHeaders(headers: http.IncomingHttpHeaders): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers)
      .filter((entry): entry is [string, string | string[]] => entry[1] !== undefined)
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : value]),
  );
}

function failedFetch(
  errorCode: string,
  current: ValidatedAuditUrl,
  redirects: string[],
  startedAt: number,
  errorMessage = "No se pudo obtener HTML público de forma segura.",
): SafeFetchResult {
  return {
    ok: false,
    finalUrl: current.normalizedUrl,
    redirectCount: redirects.length,
    fetchTimeMs: Date.now() - startedAt,
    headers: {},
    errorCode,
    errorMessage,
  };
}

export async function safeFetchHtml(validatedUrl: ValidatedAuditUrl): Promise<SafeFetchResult> {
  let current = validatedUrl;
  const redirects: string[] = [];
  const startedAt = Date.now();

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const response = await requestPinned(current);

      if (response.status >= 300 && response.status < 400) {
        if (redirects.length >= MAX_REDIRECTS) {
          return failedFetch("too_many_redirects", current, redirects, startedAt);
        }
        const next = resolveRedirect(current.url, response.headers.location);
        if (!next) {
          return failedFetch("fetch_error", current, redirects, startedAt);
        }
        let nextValidation: ValidatedAuditUrl;
        try {
          nextValidation = await validateAuditUrl(next);
        } catch {
          return failedFetch("blocked_redirect", current, [...redirects, next], startedAt);
        }
        redirects.push(nextValidation.normalizedUrl);
        current = nextValidation;
        continue;
      }

      if (response.truncated) {
        return failedFetch("too_large", current, redirects, startedAt);
      }

      if (!response.status || response.status >= 400) {
        return {
          ...failedFetch("fetch_error", current, redirects, startedAt),
          httpStatus: response.status || undefined,
          headers: toHeaders(response.headers),
        };
      }

      if (!isHtmlContentType(response.headers["content-type"])) {
        return {
          ...failedFetch("non_html", current, redirects, startedAt),
          httpStatus: response.status,
          headers: toHeaders(response.headers),
        };
      }

      return {
        ok: true,
        httpStatus: response.status,
        html: response.body,
        htmlSizeBytes: Buffer.byteLength(response.body),
        finalUrl: current.normalizedUrl,
        redirectCount: redirects.length,
        fetchTimeMs: Date.now() - startedAt,
        headers: toHeaders(response.headers),
      };
    }

    return failedFetch("too_many_redirects", current, redirects, startedAt);
  } catch {
    return failedFetch("fetch_error", current, redirects, startedAt);
  }
}
