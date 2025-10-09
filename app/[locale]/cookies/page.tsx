import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";

export default async function CookiesPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "legal.cookies" });
  const categories = t.raw("categories") as { title: string; description: string }[];

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("intro")} eyebrow="Legal" />
      <section className="container grid gap-6 md:grid-cols-3">
        {categories.map((category) => (
          <article key={category.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-muted">
            <h2 className="text-lg font-semibold text-foreground">{category.title}</h2>
            <p className="mt-2">{category.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
