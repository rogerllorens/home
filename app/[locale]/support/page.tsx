import { getTranslations } from "next-intl/server";
import { getSupportArticles } from "@/lib/content";
import { PageHero } from "@/components/sections/page-hero";

export default async function SupportPage({ params }: { params: { locale: string } }) {
  const articles = getSupportArticles(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "support" });
  const eyebrow = params.locale === "en" ? "Support" : "Ayuda";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("search")} eyebrow={eyebrow} />
      <section className="container grid gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <article key={article._id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-foreground">{article.title}</h2>
            <p className="mt-2 text-sm text-muted">{article.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
