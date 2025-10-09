const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.xder.app";

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: "weekly",
  priority: 0.7,
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: path.includes("blog") ? "daily" : "weekly",
      priority: path === "/" ? 1 : 0.7,
      lastmod: new Date().toISOString()
    };
  },
  alternateRefs: [
    {
      href: `${siteUrl}/es`,
      hreflang: "es"
    },
    {
      href: `${siteUrl}/en`,
      hreflang: "en"
    }
  ]
};
