import { useLocale, useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const yearlyMultiplier = 0.8;

export function PricingTable() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const plans = t.raw("plans") as {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
  }[];
  const ctaLabel = t("cta");

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto flex flex-col gap-12">
        <div className="max-w-2xl">
          <Badge variant="glass">{t("title")}</Badge>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-2 text-lg text-muted">{t("legal")}</p>
        </div>
        <Tabs defaultValue="monthly" className="w-full">
          <div className="flex flex-col gap-6">
            <TabsList aria-label="Billing period selector">
              <TabsTrigger value="monthly">{t("toggle.monthly")}</TabsTrigger>
              <TabsTrigger value="yearly">{t("toggle.yearly")}</TabsTrigger>
            </TabsList>
            {plans.map((plan) => (
              <TabsContent
                key={plan.name}
                value="monthly"
                className="data-[state=inactive]:hidden"
              >
                <PlanCard
                  plan={plan}
                  multiplier={1}
                  ctaLabel={ctaLabel}
                  locale={locale}
                />
              </TabsContent>
            ))}
            {plans.map((plan) => (
              <TabsContent
                key={`${plan.name}-yearly`}
                value="yearly"
                className="data-[state=inactive]:hidden"
              >
                <PlanCard
                  plan={plan}
                  multiplier={yearlyMultiplier}
                  ctaLabel={ctaLabel}
                  locale={locale}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  multiplier,
  ctaLabel,
  locale,
}: {
  plan: {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
  };
  multiplier: number;
  ctaLabel: string;
  locale: string;
}) {
  const price = parseFloat(plan.price || "0");
  const total = multiplier === 1 ? price : price * 12 * multiplier;
  const periodLabel =
    multiplier === 1
      ? plan.period
      : plan.period.includes("€")
        ? "€/año"
        : plan.period.includes("$")
          ? "$/yr"
          : plan.period;
  const zeroLabel = locale === "en" ? "Free" : "Gratis";

  return (
    <Card className="w-full border-white/15 bg-white/[0.05]">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Badge variant="outline" className="uppercase tracking-wide">
            {plan.name}
          </Badge>
          <CardTitle>{plan.description}</CardTitle>
          <p className="text-3xl font-semibold">
            {total === 0 ? zeroLabel : total.toFixed(0)}{" "}
            <span className="text-sm text-muted">{periodLabel}</span>
          </p>
        </div>
        <div className="max-w-lg space-y-3">
          <div className="mt-2 text-sm text-muted">
            <ul className="grid gap-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span aria-hidden>•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button className="w-full md:w-auto">{ctaLabel}</Button>
        </div>
      </div>
    </Card>
  );
}
