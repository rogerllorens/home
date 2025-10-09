import { PageHero } from "@/components/sections/page-hero";
import { PricingTable } from "@/components/sections/pricing-table";
import { getTranslations } from "next-intl/server";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default async function PricingPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "pricing" });
  const faq = await getTranslations({ locale: params.locale, namespace: "faq" });
  const categories = faq.raw("categories") as { name: string; items: { question: string; answer: string }[] }[];
  const eyebrow = params.locale === "en" ? "Pricing" : "Planes";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("legal")} eyebrow={eyebrow} />
      <PricingTable />
      <section className="container space-y-8">
        {categories.map((category) => (
          <div key={category.name}>
            <h2 className="text-2xl font-semibold text-foreground">{category.name}</h2>
            <Accordion type="single" collapsible className="mt-4 space-y-4">
              {category.items.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </section>
    </div>
  );
}
