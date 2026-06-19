import type { ParsedHtmlSummary } from "./types";

function decodeHtml(value: string) {
  return value.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return decodeHtml(match?.[2] ?? match?.[3] ?? match?.[4] ?? "") || null;
}

function metaContent(html: string, name: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const found = tags.find((tag) => (attr(tag, "name") ?? attr(tag, "property") ?? "").toLowerCase() === name.toLowerCase());
  return found ? attr(found, "content") : null;
}

function textMatches(html: string, tag: string, limit = 8) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))].slice(0, limit).map((match) => decodeHtml(match[1].replace(/<[^>]+>/g, ""))).filter(Boolean);
}

export function parseHtmlSummary(html: string, finalUrl: string): ParsedHtmlSummary {
  const title = decodeHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, "") ?? "") || null;
  const description = metaContent(html, "description");
  const robotsMeta = metaContent(html, "robots");
  const canonicalTag = (html.match(/<link\b[^>]*rel\s*=\s*["'][^"']*canonical[^"']*["'][^>]*>/i) ?? [])[0];
  const canonicalUrl = canonicalTag ? attr(canonicalTag, "href") : null;
  const htmlTag = (html.match(/<html\b[^>]*>/i) ?? [])[0] ?? "";
  const viewport = metaContent(html, "viewport");
  const charsetTag = (html.match(/<meta\b[^>]*charset\s*=/i) ?? [])[0] ?? "";
  const bodyText = decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
  const baseHost = new URL(finalUrl).hostname;
  let internalLinksCount = 0;
  let externalLinksCount = 0;
  let nofollowLinksCount = 0;
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(match[0], "href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
    if ((attr(match[0], "rel") ?? "").toLowerCase().includes("nofollow")) nofollowLinksCount += 1;
    try {
      const linkUrl = new URL(href, finalUrl);
      if (linkUrl.hostname === baseHost) internalLinksCount += 1;
      else externalLinksCount += 1;
    } catch {}
  }
  let imageCount = 0, imagesWithoutAlt = 0, imagesWithEmptyAlt = 0, imagesMissingDimensions = 0, lazyImagesCount = 0, modernImageFormats = 0, largeImageCandidates = 0;
  const imageSamples: string[] = [];
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    imageCount += 1;
    const tag = match[0];
    const alt = attr(tag, "alt");
    const src = attr(tag, "src") ?? attr(tag, "data-src") ?? "";
    if (alt === null) imagesWithoutAlt += 1;
    else if (!alt.trim()) imagesWithEmptyAlt += 1;
    if (!attr(tag, "width") || !attr(tag, "height")) imagesMissingDimensions += 1;
    if ((attr(tag, "loading") ?? "").toLowerCase() === "lazy") lazyImagesCount += 1;
    if (/\.(webp|avif)(\?|$)/i.test(src)) modernImageFormats += 1;
    if (/\.(png|jpe?g)(\?|$)/i.test(src) && /(large|hero|banner|full|2048|1920|1600)/i.test(src)) largeImageCandidates += 1;
    if (src && imageSamples.length < 5) imageSamples.push(src);
  }
  const jsonLdBlocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()).filter((block) => block.length <= 100_000).slice(0, 12);
  return {
    title, titleLength: title?.length ?? 0, metaDescription: description, metaDescriptionLength: description?.length ?? 0, robotsMeta, canonicalUrl,
    lang: attr(htmlTag, "lang"), charset: attr(charsetTag, "charset"), viewport,
    h1Texts: textMatches(html, "h1"), h2Texts: textMatches(html, "h2"), wordCount: bodyText ? bodyText.split(/\s+/).length : 0, bodyTextPreview: bodyText.slice(0, 600),
    internalLinksCount, externalLinksCount, nofollowLinksCount, hreflangCount: (html.match(/hreflang\s*=/gi) ?? []).length,
    imageCount, imagesWithoutAlt, imagesWithEmptyAlt, imagesMissingDimensions, lazyImagesCount, modernImageFormats, largeImageCandidates, imageSamples,
    openGraph: { title: Boolean(metaContent(html, "og:title")), description: Boolean(metaContent(html, "og:description")), image: Boolean(metaContent(html, "og:image")) }, twitterCard: Boolean(metaContent(html, "twitter:card")), jsonLdBlocks,
  };
}
