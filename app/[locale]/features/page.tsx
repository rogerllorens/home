import { getTranslations } from "next-intl/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/sections/page-hero";

export default async function FeaturesPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "features" });
  const list = t.raw("list") as { title: string; description: string }[];
  const title = params.locale === "en" ? "Features" : "Funciones";

  return (
    <div className="space-y-12">
      <PageHero title={title} description={t("intro")} eyebrow={title} />
      <section className="container grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {list.map((feature) => (
          <Card key={feature.title}>
            <CardTitle>{feature.title}</CardTitle>
            <CardDescription>{feature.description}</CardDescription>
          </Card>
        ))}
      </section>
    </div>
  );
}
