import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://rankelia.ai";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/admin/", "/api/"] }], sitemap: `${baseUrl}/sitemap.xml` };
}
