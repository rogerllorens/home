import { defaultLocale } from "./i18n";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.xder.app";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Xder",
  url: siteUrl,
  logo: `${siteUrl}/icons/icon-512.svg`,
  sameAs: ["https://www.instagram.com/xderapp", "https://www.linkedin.com/company/xder"]
};

export const mobileApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "Xder",
  operatingSystem: "iOS, Android",
  applicationCategory: "LifestyleApplication",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "2140"
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR"
  },
  url: siteUrl
};

export const buildProductOfferSchema = ({
  name,
  price,
  priceCurrency
}: {
  name: string;
  price: string;
  priceCurrency: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name,
  offers: {
    "@type": "Offer",
    price,
    priceCurrency,
    availability: "https://schema.org/InStock"
  }
});

export const buildFaqSchema = (faq: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
    }
  }))
});

export const buildBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url
  }))
});

export const buildArticleSchema = ({
  title,
  description,
  slug,
  date
}: {
  title: string;
  description: string;
  slug: string;
  date: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  datePublished: date,
  author: {
    "@type": "Person",
    name: "Equipo Xder"
  },
  publisher: organizationSchema,
  mainEntityOfPage: `${siteUrl}/${defaultLocale}/blog/${slug}`
});
