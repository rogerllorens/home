import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";
import { Button } from "@/components/ui/button";

export default async function DownloadPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "download" });
  const stores = t.raw("stores") as { name: string; label: string; os: string }[];
  const eyebrow = params.locale === "en" ? "Download" : "Descargar";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("description")} eyebrow={eyebrow} />
      <section className="container grid gap-6 md:grid-cols-2">
        {stores.map((store) => (
          <div key={store.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-foreground">{store.name}</h2>
            <p className="mt-2 text-sm text-muted">{store.label}</p>
            <Button className="mt-4" variant="secondary">
              {params.locale === "en" ? "Notify me" : "Avisarme"}
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
