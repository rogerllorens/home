import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";

export default async function LegalBasesPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "legal.bases" });
  const grounds = t.raw("grounds") as { title: string; description: string }[];

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("intro")} eyebrow="Legal" />
      <section className="container space-y-6">
        {grounds.map((ground) => (
          <article key={ground.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-muted">
            <h2 className="text-lg font-semibold text-foreground">{ground.title}</h2>
            <p className="mt-2">{ground.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
