import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AmbassadorsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "ambassadors" });
  const common = await getTranslations({ locale: params.locale, namespace: "common.ambassadors" });
  const requirements = t.raw("requirements") as string[];
  const perks = common.raw("perks") as string[];
  const eyebrow = params.locale === "en" ? "Community" : "Comunidad";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("intro")} eyebrow={eyebrow} />
      <section className="container grid gap-8 md:grid-cols-2">
        <Card>
          <CardTitle>{params.locale === "en" ? "Benefits" : "Beneficios"}</CardTitle>
          <CardDescription>
            <ul className="space-y-2">
              {perks.map((perk) => (
                <li key={perk}>• {perk}</li>
              ))}
            </ul>
          </CardDescription>
          <Button className="mt-6">{common("cta")}</Button>
        </Card>
        <Card>
          <CardTitle>{params.locale === "en" ? "Requirements" : "Requisitos"}</CardTitle>
          <CardDescription>
            <ul className="space-y-2">
              {requirements.map((req) => (
                <li key={req}>• {req}</li>
              ))}
            </ul>
          </CardDescription>
        </Card>
      </section>
    </div>
  );
}
