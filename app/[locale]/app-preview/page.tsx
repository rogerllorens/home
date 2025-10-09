import Image from "next/image";
import { PageHero } from "@/components/sections/page-hero";

const previews: Record<string, { title: string; description: string; image: string }[]> = {
  es: [
    {
      title: "Feed inclusivo",
      description: "Descubre perfiles destacados según tus intereses y energía social.",
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1"
    },
    {
      title: "Búsqueda por intereses",
      description: "Filtra por idioma, actividad y objetivos en segundos.",
      image: "https://images.unsplash.com/photo-1529158062015-cad636e69505"
    },
    {
      title: "Modo seguro",
      description: "Activa check-ins automáticos y alertas silenciosas.",
      image: "https://images.unsplash.com/photo-1520342868574-5fa3804e551c"
    }
  ],
  en: [
    {
      title: "Inclusive feed",
      description: "Discover highlighted profiles according to your interests and social energy.",
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1"
    },
    {
      title: "Interest search",
      description: "Filter by language, activity and goals in seconds.",
      image: "https://images.unsplash.com/photo-1529158062015-cad636e69505"
    },
    {
      title: "Safety mode",
      description: "Enable automatic check-ins and silent alerts.",
      image: "https://images.unsplash.com/photo-1520342868574-5fa3804e551c"
    }
  ]
};

export default function AppPreviewPage({ params }: { params: { locale: string } }) {
  const items = previews[params.locale] ?? previews.es;
  const eyebrow = params.locale === "en" ? "Preview" : "Vista previa";

  return (
    <div className="space-y-12">
      <PageHero title={params.locale === "en" ? "App preview" : "Vistas de la app"} description={params.locale === "en" ? "A glimpse at the Xder mobile experience." : "Una mirada a la experiencia móvil de Xder."} eyebrow={eyebrow} />
      <section className="container grid gap-8 md:grid-cols-3">
        {items.map((preview) => (
          <article key={preview.title} className="space-y-3">
            <div className="overflow-hidden rounded-[32px] border border-white/10">
              <Image src={preview.image} alt={preview.title} width={320} height={640} className="object-cover" />
            </div>
            <h2 className="text-xl font-semibold">{preview.title}</h2>
            <p className="text-sm text-muted">{preview.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
