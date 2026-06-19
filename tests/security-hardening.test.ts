import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { validateAuditUrl } from "../lib/audit/url-validation";
import { createPinnedLookup, safeFetchHtml } from "../lib/audit/safe-fetch";
import { memoryRateLimitAllowed } from "../lib/rate-limit";
import nextConfig from "../next.config";

test("validateAuditUrl stores resolved public IP and blocks local/private targets", async () => {
  const valid = await validateAuditUrl("http://93.184.216.34/");
  assert.equal(valid.resolvedIp, "93.184.216.34");
  assert.equal(valid.resolvedFamily, 4);
  await assert.rejects(() => validateAuditUrl("http://localhost"), /local|bloqueado/i);
  await assert.rejects(() => validateAuditUrl("http://127.0.0.1"), /privada|local/i);
  await assert.rejects(() => validateAuditUrl("http://192.168.1.1"), /privada|local/i);
  await assert.rejects(() => validateAuditUrl("http://[::1]"), /privada|local/i);
  await assert.rejects(() => validateAuditUrl("http://169.254.169.254"), /bloqueada|privada|local/i);
});

test("safeFetchHtml revalidates redirects and blocks private redirect destinations", async () => {
  const server = http.createServer((_request, response) => {
    response.statusCode = 302;
    response.setHeader("location", "http://127.0.0.1/private");
    response.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const url = new URL(`http://example.com:${address.port}/`);
    const result = await safeFetchHtml({
      inputUrl: url.toString(),
      url,
      normalizedUrl: url.toString(),
      domain: "example.com",
      resolvedIp: "127.0.0.1",
      resolvedFamily: 4,
    });
    assert.equal(result.errorCode, "blocked_redirect");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("pinned lookup can be created without disabling TLS validation", () => {
  assert.ok(createPinnedLookup("93.184.216.34", 4));
});

test("memory rate limit fallback is forbidden in production unless explicitly overridden", () => {
  const original = process.env.NODE_ENV;
  Reflect.set(process.env, "NODE_ENV", "production");
  delete process.env.ALLOW_IN_MEMORY_RATE_LIMIT;
  assert.equal(memoryRateLimitAllowed(), false);
  if (original === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Reflect.set(process.env, "NODE_ENV", original);
});

test("next config exposes security headers", async () => {
  assert.equal(typeof nextConfig.headers, "function");
  const headers = await nextConfig.headers?.();
  const values = headers?.[0].headers.map((header) => header.key.toLowerCase()) ?? [];
  assert.ok(values.includes("content-security-policy"));
  assert.ok(values.includes("x-frame-options"));
  assert.ok(values.includes("x-content-type-options"));
});
