import { withContentlayer } from "next-contentlayer";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "next-pwa";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true
});

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});

const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverActions: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "images.pexels.com"
      }
    ]
  },
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  }
};

export default withAnalyzer(withPWA(withNextIntl(withContentlayer(nextConfig))));
