import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function JobsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "jobs" });
  const common = await getTranslations({ locale: params.locale, namespace: "common.jobs" });
  const positions = t.raw("positions") as { title: string; description: string; requirements: string[] }[];
  const benefits = common.raw("benefits") as string[];

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("intro")} eyebrow="Careers" />
      <section className="container grid gap-8 md:grid-cols-2">
        {positions.map((position) => (
          <Card key={position.title} className="flex flex-col justify-between">
            <div className="space-y-4">
              <Badge variant="outline">{common("location")}</Badge>
              <CardTitle>{position.title}</CardTitle>
              <CardDescription>{position.description}</CardDescription>
              <ul className="space-y-2 text-sm">
                {position.requirements.map((req) => (
                  <li key={req}>• {req}</li>
                ))}
              </ul>
            </div>
            <Button className="mt-6 w-full">{common("apply")}</Button>
          </Card>
        ))}
      </section>
      <section className="container rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-muted">
        <h2 className="text-lg font-semibold text-foreground">{params.locale === "en" ? "Benefits" : "Beneficios"}</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {benefits.map((benefit) => (
            <li key={benefit}>• {benefit}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
