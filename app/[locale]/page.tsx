import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PricingTable } from "@/components/sections/pricing-table";

export default async function HomePage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "home" });

  const benefits = t.raw("benefits") as { title: string; description: string }[];
  const steps = t.raw("how.steps") as { title: string; description: string }[];
  const proof = t.raw("socialProof") as string[];

  return (
    <div className="relative overflow-hidden">
      <section className="container grid gap-12 py-24 lg:grid-cols-2">
        <div className="space-y-6">
          <Badge variant="glass">Xder</Badge>
          <h1 className="text-5xl font-semibold tracking-tight">{t("hero.title")}</h1>
          <p className="text-lg text-muted">{t("hero.subtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/${params.locale}/download`}>{t("hero.primary")}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={`/${params.locale}/features`}>{t("hero.secondary")}</Link>
            </Button>
          </div>
          <ul className="grid gap-3 text-sm text-muted">
            {proof.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FF7A00]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex justify-center">
          <div className="absolute -top-16 h-96 w-96 rounded-full bg-[#FF6A00]/30 blur-3xl" aria-hidden />
          <Image
            src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1"
            alt="Personas sonriendo en un encuentro de Xder"
            width={420}
            height={820}
            className="relative rounded-[32px] border border-white/10 object-cover shadow-glow"
            priority
          />
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {benefits.map((benefit) => (
            <Card key={benefit.title}>
              <CardTitle>{benefit.title}</CardTitle>
              <CardDescription>{benefit.description}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="max-w-2xl space-y-4">
          <Badge variant="glass">{t("how.title")}</Badge>
          <h2 className="text-4xl font-semibold">{t("how.title")}</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title}>
              <span className="text-sm text-muted">0{index + 1}</span>
              <CardTitle className="mt-3 text-2xl">{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-8 md:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <Badge variant="glass">Testimonio</Badge>
            <p className="text-2xl font-medium leading-relaxed">“{t("testimonial.quote")}”</p>
            <p className="text-sm text-muted">{t("testimonial.author")}</p>
          </div>
          <Card>
            <CardTitle>{t("finalCta.title")}</CardTitle>
            <CardDescription>{t("finalCta.description")}</CardDescription>
            <Button asChild className="mt-6 w-full">
              <Link href={`/${params.locale}/download`}>{t("finalCta.primary")}</Link>
            </Button>
          </Card>
        </div>
      </section>

      <PricingTable />
    </div>
  );
}
