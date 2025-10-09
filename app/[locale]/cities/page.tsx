import Link from "next/link";
import { getCities } from "@/lib/content";
import { PageHero } from "@/components/sections/page-hero";

export default function CitiesIndex({ params }: { params: { locale: string } }) {
  const cities = getCities(params.locale);
  const title = params.locale === "en" ? "Cities" : "Ciudades";
  const description =
    params.locale === "en"
      ? "Explore active Xder communities across cities."
      : "Explora comunidades activas en distintas ciudades Xder.";

  return (
    <div className="space-y-12">
      <PageHero title={title} description={description} eyebrow={title} />
      <section className="container grid gap-6 md:grid-cols-2">
        {cities.map((city) => {
          const slug = city._raw.flattenedPath.split("/").pop()?.replace(/-..$/, "");
          return (
            <Link key={city._id} href={`/${params.locale}/cities/${slug}`} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-foreground">{city.title}</h2>
              <p className="mt-2 text-sm text-muted">{city.description}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
