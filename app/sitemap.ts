import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://rankelia.ai";
  return ["", "/login", "/privacy", "/terms", "/cookies", "/support"].map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date(), changeFrequency: path ? "monthly" : "weekly", priority: path ? 0.6 : 1 })) as MetadataRoute.Sitemap;
}
