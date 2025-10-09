import { getTranslations } from "next-intl/server";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHero } from "@/components/sections/page-hero";

export default async function FaqPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "faq" });
  const categories = t.raw("categories") as { name: string; items: { question: string; answer: string }[] }[];
  const eyebrow = params.locale === "en" ? "FAQ" : "Preguntas";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} eyebrow={eyebrow} />
      <section className="container grid gap-8 md:grid-cols-2">
        {categories.map((category) => (
          <div key={category.name}>
            <h2 className="text-lg font-semibold">{category.name}</h2>
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
