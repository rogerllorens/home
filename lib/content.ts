import { allPosts, allSupportArticles, allFaqArticles, allCities, allCountries } from "contentlayer/generated";

export function getPostsByLocale(locale: string) {
  return allPosts.filter((post) => post.locale === locale).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(locale: string, slug: string) {
  return getPostsByLocale(locale).find((post) => post._raw.flattenedPath.endsWith(slug));
}

export function getSupportArticles(locale: string) {
  return allSupportArticles.filter((article) => article.locale === locale);
}

export function getFaqEntries(locale: string) {
  return allFaqArticles.filter((faq) => faq.locale === locale);
}

export function getCities(locale: string) {
  return allCities.filter((city) => city.locale === locale);
}

export function getCountries(locale: string) {
  return allCountries.filter((country) => country.locale === locale);
}
