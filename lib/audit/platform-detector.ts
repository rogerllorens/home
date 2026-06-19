import type { PlatformDetection } from "./types";

export function detectPlatform(html: string, headers: Record<string, string> = {}, url = ""): PlatformDetection {
  const haystack = `${html}\n${JSON.stringify(headers)}\n${url}`.toLowerCase();
  const rules: Array<[string, RegExp[]]> = [
    ["Shopify", [/cdn\.shopify\.com/, /shopify\.theme/, /\/cart\.js/, /x-shopify/, /myshopify/]],
    ["WooCommerce / WordPress", [/wp-content/, /wp-json/, /woocommerce/, /generator[^>]+wordpress/, /wc-ajax/]],
    ["PrestaShop", [/prestashop/, /\/modules\//, /\bps_/]],
    ["Magento", [/magento/, /\/static\/version/, /\bmage\//]],
    ["Shopware", [/shopware/, /\/store-api/, /\bsw-/]],
    ["Wix", [/wixstatic/, /x-wix/]],
    ["Squarespace", [/squarespace/]],
  ];
  let best: PlatformDetection = { platform: "Desconocida", confidence: 0, evidence: [] };
  for (const [platform, patterns] of rules) {
    const evidence = patterns.filter((pattern) => pattern.test(haystack)).map((pattern) => pattern.source.replace(/\\/g, ""));
    const confidence = Math.min(100, evidence.length * 35 + (evidence.length > 1 ? 20 : 0));
    if (confidence > best.confidence) best = { platform, confidence, evidence };
  }
  return best.confidence < 35 ? { platform: "Desconocida", confidence: best.confidence, evidence: best.evidence } : best;
}
