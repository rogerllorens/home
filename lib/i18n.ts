export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const localeNames: Record<Locale, string> = {
  es: "Español",
  en: "English"
};

export const domains = [
  {
    domain: process.env.NEXT_PUBLIC_SITE_URL ?? "xder.app",
    defaultLocale,
    locales
  }
];

export const routing = {
  locales,
  defaultLocale,
  localeDetection: true
};
