import { DefaultSeoProps } from "next-seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.xder.app";

export const defaultSeo: DefaultSeoProps = {
  titleTemplate: "%s | Xder",
  defaultTitle: "Xder",
  description:
    "Xder conecta amistades y citas en un espacio seguro, moderado y pensado para crear experiencias reales en cualquier ciudad.",
  canonical: siteUrl,
  openGraph: {
    url: siteUrl,
    type: "website",
    siteName: "Xder",
    images: [
      {
        url: `${siteUrl}/og/default.svg`,
        width: 1200,
        height: 630,
        alt: "Xder web preview"
      }
    ]
  },
  twitter: {
    handle: "@xderapp",
    site: "@xderapp",
    cardType: "summary_large_image"
  },
  additionalLinkTags: [
    { rel: "icon", href: "/icons/favicon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", href: "/icons/icon-192.svg" },
    { rel: "manifest", href: "/manifest.webmanifest" }
  ],
  additionalMetaTags: [{ name: "theme-color", content: "#0A0A0A" }]
};

export const buildSeo = ({
  title,
  description,
  path,
  locale
}: {
  title: string;
  description: string;
  path: string;
  locale: string;
}) => {
  const url = `${siteUrl}${path}`;
  const imagePath = `${siteUrl}/og${path}.svg`.replace(/\/$/, "");
  return {
    title,
    description,
    canonical: url,
    openGraph: {
      url,
      locale,
      title,
      description,
      images: [
        {
          url: imagePath.match(/\.(png|jpe?g|webp|avif|svg)$/i)
            ? imagePath
            : `${siteUrl}/og/default.svg`,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    additionalMetaTags: [
      {
        property: "og:locale:alternate",
        content: locale === "es" ? "en_US" : "es_ES"
      }
    ]
  };
};
