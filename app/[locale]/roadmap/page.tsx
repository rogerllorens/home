import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";

export default async function RoadmapPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "roadmap" });
  const columns = t.raw("columns") as { title: string; items: string[] }[];
  const eyebrow = params.locale === "en" ? "Roadmap" : "Hoja de ruta";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} eyebrow={eyebrow} />
      <section className="container grid gap-6 md:grid-cols-3">
        {columns.map((column) => (
          <article key={column.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-foreground">{column.title}</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {column.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
