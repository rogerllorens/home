import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "legal.privacy" });
  const sections = t.raw("sections") as { title: string; description: string }[];

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("intro")} eyebrow="Legal" />
      <section className="container space-y-8 text-sm leading-relaxed text-muted">
        {sections.map((section) => (
          <article key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            <p className="mt-2">{section.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
