import Link from "next/link";
import { getCountries } from "@/lib/content";
import { PageHero } from "@/components/sections/page-hero";

export default function CountriesIndex({ params }: { params: { locale: string } }) {
  const countries = getCountries(params.locale);
  const title = params.locale === "en" ? "Countries" : "Países";
  const description =
    params.locale === "en"
      ? "Find Xder communities across every available country."
      : "Encuentra comunidades Xder en cada país disponible.";

  return (
    <div className="space-y-12">
      <PageHero title={title} description={description} eyebrow={title} />
      <section className="container grid gap-6 md:grid-cols-2">
        {countries.map((country) => {
          const slug = country._raw.flattenedPath.split("/").pop()?.replace(/-..$/, "");
          return (
            <Link key={country._id} href={`/${params.locale}/countries/${slug}`} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-foreground">{country.title}</h2>
              <p className="mt-2 text-sm text-muted">{country.description}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
