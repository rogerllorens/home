import { notFound } from "next/navigation";
import { getCities } from "@/lib/content";
import { PageHero } from "@/components/sections/page-hero";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Mdx } from "@/components/mdx/mdx-components";

export default function CityPage({ params }: { params: { locale: string; city: string } }) {
  const cities = getCities(params.locale);
  const city = cities.find((entry) => entry._raw.flattenedPath.split("/").pop() === `${params.city}-${params.locale}`);
  if (!city) {
    notFound();
  }

  const breadcrumbs = [
    { label: params.locale === "en" ? "Home" : "Inicio", href: `/${params.locale}` },
    { label: params.locale === "en" ? "Cities" : "Ciudades", href: `/${params.locale}/cities` },
    { label: city.title }
  ];

  return (
    <div className="space-y-10">
      <Breadcrumbs items={breadcrumbs} className="container pt-6" />
      <PageHero title={city.title} description={city.description} eyebrow={params.locale === "en" ? "City" : "Ciudad"} />
      <section className="container rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-muted">
        <p className="font-semibold text-foreground">
          {params.locale === "en" ? "Climate" : "Clima"}: {city.climate}
        </p>
        <div className="prose prose-invert mt-4 max-w-none text-sm">
          <Mdx code={city.body.code} />
        </div>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return getCities("es").concat(getCities("en")).map((city) => {
    const slug = city._raw.flattenedPath.split("/").pop()?.replace(/-..$/, "");
    return {
      locale: city.locale,
      city: slug as string
    };
  });
}
