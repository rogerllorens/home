import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function PressPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "press" });
  const common = await getTranslations({ locale: params.locale, namespace: "common.press" });
  const highlights = t.raw("highlights") as string[];
  const eyebrow = params.locale === "en" ? "Press" : "Prensa";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("intro")} eyebrow={eyebrow} />
      <section className="container grid gap-8 md:grid-cols-2">
        <Card>
          <CardTitle>{common("kit")}</CardTitle>
          <CardDescription>
            <ul className="space-y-2">
              {highlights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </CardDescription>
          <Button className="mt-6" variant="secondary">
            {common("kit")}
          </Button>
        </Card>
        <Card>
          <CardTitle>{common("contacts")}</CardTitle>
          <CardDescription>
            <p>
              {common("contacts")}: <a className="text-[#60A5FA]" href={`mailto:${common("pressEmail")}`}>{common("pressEmail")}</a>
            </p>
          </CardDescription>
        </Card>
      </section>
    </div>
  );
}
