import { Card } from "@/components/ui/Card";

export const metadata = { title: "Blog SEO ecommerce | Rankelia.ai", description: "Guías futuras sobre SEO ecommerce, structured data, GEO/AEO y optimización de catálogos." };
export default function BlogPage() { return <main className="mx-auto max-w-5xl px-4 py-20"><h1 className="text-5xl font-black">Blog SEO ecommerce</h1><p className="mt-5 text-lg text-slate-600">Estamos preparando guías reales. No mostramos posts fake como si estuvieran publicados.</p><div className="mt-8 grid gap-5 md:grid-cols-3">{["Structured data ecommerce", "GEO/AEO para tiendas", "CSV SEO workflows"].map((topic) => <Card key={topic}><h2 className="text-xl font-black">{topic}</h2><p className="mt-2 text-slate-600">Próximamente.</p></Card>)}</div></main>; }
