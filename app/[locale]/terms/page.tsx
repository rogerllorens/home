import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";

export default async function TermsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "legal.terms" });

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("intro")} eyebrow="Legal" />
      <section className="container space-y-6 text-sm text-muted">
        <p>
          {t("intro")} Compartimos responsabilidades, límites de uso y mecanismos para resolver disputas con transparencia.
        </p>
      </section>
    </div>
  );
}
