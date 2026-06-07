import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rankelia.ai | Generador CSV SEO para productos y categorías ecommerce",
  description: "Sube un Excel o CSV y genera descripciones, metatítulos, metadescripciones, keywords, FAQs, slugs y textos SEO para Shopify, Prestashop y WooCommerce con Rankelia.ai.",
  keywords: ["generador CSV SEO", "descripciones producto IA", "SEO ecommerce IA", "Shopify SEO CSV", "Prestashop SEO CSV", "WooCommerce SEO CSV", "categorías ecommerce SEO", "Excel productos SEO", "CSV productos ecommerce"],
  openGraph: {
    title: "Rankelia.ai | Generador CSV SEO ecommerce",
    description: "Convierte un Excel o CSV de productos y categorías en contenido SEO ecommerce listo para revisar e importar.",
    url: "https://rankelia.ai",
    siteName: "Rankelia.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rankelia.ai | Generador CSV SEO ecommerce",
    description: "Genera contenido SEO masivo para Shopify, Prestashop y WooCommerce desde CSV o Excel.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
