import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function GuidelinesPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "guidelines" });
  const principles = t.raw("principles") as { title: string; description: string }[];
  const eyebrow = params.locale === "en" ? "Guidelines" : "Normas";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} eyebrow={eyebrow} />
      <section className="container grid gap-8 md:grid-cols-2">
        {principles.map((principle) => (
          <Card key={principle.title}>
            <CardTitle>{principle.title}</CardTitle>
            <CardDescription>{principle.description}</CardDescription>
          </Card>
        ))}
      </section>
    </div>
  );
}
