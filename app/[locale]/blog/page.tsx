import Link from "next/link";
import { getPostsByLocale } from "@/lib/content";
import { PageHero } from "@/components/sections/page-hero";

const descriptions: Record<string, string> = {
  es: "Historias, guías y actualizaciones de la comunidad Xder.",
  en: "Stories, guides and updates from the Xder community."
};

export default function BlogPage({ params }: { params: { locale: string } }) {
  const posts = getPostsByLocale(params.locale);

  return (
    <div className="space-y-12">
      <PageHero title="Blog" description={descriptions[params.locale] ?? descriptions.es} eyebrow="Blog" />
      <section className="container grid gap-8 md:grid-cols-2">
        {posts.map((post) => (
          <article key={post._id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase text-muted">{new Date(post.date).toLocaleDateString(params.locale)}</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">{post.title}</h2>
            <p className="mt-2 text-sm text-muted">{post.description}</p>
            <Link className="mt-4 inline-flex items-center text-[#FF7A00]" href={`/${params.locale}/blog/${post._raw.flattenedPath.split("/").pop()}`}>
              {params.locale === "en" ? "Read more" : "Leer más"}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
