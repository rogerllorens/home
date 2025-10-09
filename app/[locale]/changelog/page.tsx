import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";

export default async function ChangelogPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "changelog" });
  const entries = t.raw("entries") as { version: string; date: string; items: string[] }[];
  const eyebrow = params.locale === "en" ? "Changelog" : "Novedades";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} eyebrow={eyebrow} />
      <section className="container space-y-6">
        {entries.map((entry) => (
          <article key={entry.version} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <header className="flex items-center justify-between text-sm text-muted">
              <span>v{entry.version}</span>
              <time>{entry.date}</time>
            </header>
            <ul className="mt-4 space-y-2 text-sm">
              {entry.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
