import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";
import { ContactForm } from "@/components/forms/contact-form";

export default async function ContactPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "contact" });
  const common = await getTranslations({ locale: params.locale, namespace: "common.contact" });
  const emails = t.raw("emails") as { label: string; value: string }[];
  const eyebrow = params.locale === "en" ? "Support" : "Soporte";

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("description")} eyebrow={eyebrow} />
      <section className="container grid gap-12 lg:grid-cols-2">
        <ContactForm
          labels={{
            name: common("name"),
            email: common("email"),
            topic: common("topic"),
            message: common("message"),
            submit: common("submit"),
            success: common("success"),
            error: common("error")
          }}
        />
        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-muted">
          <h2 className="text-lg font-semibold text-foreground">{eyebrow}</h2>
          <ul className="space-y-3">
            {emails.map((email) => (
              <li key={email.value}>
                <span className="block text-foreground">{email.label}</span>
                <a className="text-[#60A5FA]" href={`mailto:${email.value}`}>
                  {email.value}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
