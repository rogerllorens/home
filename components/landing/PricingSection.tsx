import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { pricingPacks } from "@/lib/mock-data";

export function PricingSection() {
  return <section id="precios" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="text-center"><Badge variant="ai">Pricing placeholder</Badge><h2 className="mt-4 text-3xl font-black text-slate-950 md:text-4xl">Packs preparados para ecommerce y agencias</h2></div><div className="mt-8 grid gap-5 md:grid-cols-3">{pricingPacks.map((pack) => <Card className={pack.featured ? "ring-2 ring-blue-500" : ""} key={pack.name} variant={pack.featured ? "elevated" : "default"}><h3 className="text-xl font-black">{pack.name}</h3><p className="mt-2 text-slate-600">{pack.description}</p><p className="mt-6 text-4xl font-black">{pack.price}</p><Button className="mt-6 w-full" variant={pack.featured ? "primary" : "secondary"}>Elegir pack</Button></Card>)}</div></section>;
}
