import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://rankelia.ai"),
  alternates: { canonical: "/" },
  title: "Rankelia.ai | Generador CSV SEO para productos y categorías ecommerce",
  description: "Sube un CSV y genera descripciones, metatítulos, metadescripciones, keywords, FAQs, slugs y textos SEO para Shopify, Prestashop y WooCommerce con Rankelia.ai.",
  keywords: ["generador CSV SEO", "descripciones producto IA", "SEO ecommerce IA", "Shopify SEO CSV", "Prestashop SEO CSV", "WooCommerce SEO CSV", "categorías ecommerce SEO", "CSV productos SEO", "CSV productos ecommerce"],
  openGraph: {
    images: [{ url: "/og-rankelia.png", width: 1200, height: 630, alt: "Rankelia.ai CSV SEO ecommerce" }],
    title: "Rankelia.ai | Generador CSV SEO ecommerce",
    description: "Convierte un CSV de productos y categorías en contenido SEO ecommerce listo para revisar e importar.",
    url: "https://rankelia.ai",
    siteName: "Rankelia.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rankelia.ai | Generador CSV SEO ecommerce",
    description: "Genera contenido SEO masivo para Shopify, Prestashop y WooCommerce desde CSV.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
