import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByLocale } from "@/lib/content";
import { Mdx } from "@/components/mdx/mdx-components";
import { PageHero } from "@/components/sections/page-hero";

export default function BlogPostPage({ params }: { params: { locale: string; slug: string } }) {
  const post = getPostBySlug(params.locale, params.slug);
  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-12">
      <PageHero title={post.title} description={post.description} eyebrow="Blog" />
      <section className="container prose prose-invert max-w-3xl">
        <Mdx code={post.body.code} />
      </section>
    </article>
  );
}

export function generateStaticParams() {
  return getPostsByLocale("es").concat(getPostsByLocale("en")).map((post) => ({
    locale: post.locale,
    slug: post._raw.flattenedPath.split("/").pop() as string
  }));
}
