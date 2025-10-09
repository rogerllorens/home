import { getTranslations } from "next-intl/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/sections/page-hero";

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "about" });
  const values = t.raw("values") as { title: string; description: string }[];
  const eyebrow = params.locale === "en" ? "About" : "Sobre";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={`${t("mission")} ${t("vision")}`} eyebrow={eyebrow} />
      <section className="container grid gap-8 md:grid-cols-3">
        {values.map((value) => (
          <Card key={value.title}>
            <CardTitle>{value.title}</CardTitle>
            <CardDescription>{value.description}</CardDescription>
          </Card>
        ))}
      </section>
    </div>
  );
}
