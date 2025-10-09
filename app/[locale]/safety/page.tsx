import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function SafetyPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "safety" });
  const principles = t.raw("principles") as { title: string; description: string }[];
  const steps = t.raw("reporting.steps") as string[];
  const stepLabel = params.locale === "en" ? "Step" : "Paso";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("intro")} eyebrow={params.locale === "en" ? "Safety" : "Seguridad"} />
      <section className="container grid gap-8 md:grid-cols-2">
        {principles.map((principle) => (
          <Card key={principle.title}>
            <CardTitle>{principle.title}</CardTitle>
            <CardDescription>{principle.description}</CardDescription>
          </Card>
        ))}
      </section>
      <section className="container">
        <h2 className="text-3xl font-semibold">{t("reporting.title")}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <span className="text-sm text-muted">{stepLabel} {index + 1}</span>
              <p className="mt-2 text-sm">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
