import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  const normalized = locale === "en" ? "en" : "es";

  return {
    locale: normalized,
    messages: (await import(`../messages/${normalized}.json`)).default
  };
});
