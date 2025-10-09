import { notFound } from "next/navigation";
import { getCountries } from "@/lib/content";
import { PageHero } from "@/components/sections/page-hero";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Mdx } from "@/components/mdx/mdx-components";

export default function CountryPage({ params }: { params: { locale: string; country: string } }) {
  const countries = getCountries(params.locale);
  const country = countries.find((entry) => entry._raw.flattenedPath.split("/").pop() === `${params.country}-${params.locale}`);
  if (!country) {
    notFound();
  }

  const breadcrumbs = [
    { label: params.locale === "en" ? "Home" : "Inicio", href: `/${params.locale}` },
    { label: params.locale === "en" ? "Countries" : "Países", href: `/${params.locale}/countries` },
    { label: country.title }
  ];

  return (
    <div className="space-y-10">
      <Breadcrumbs items={breadcrumbs} className="container pt-6" />
      <PageHero title={country.title} description={country.description} eyebrow={params.locale === "en" ? "Country" : "País"} />
      <section className="container prose prose-invert max-w-3xl text-sm">
        <Mdx code={country.body.code} />
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return getCountries("es").concat(getCountries("en")).map((country) => {
    const slug = country._raw.flattenedPath.split("/").pop()?.replace(/-..$/, "");
    return {
      locale: country.locale,
      country: slug as string
    };
  });
}
