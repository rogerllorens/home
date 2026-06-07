import { Card } from "@/components/ui/Card";
import { pricingPacks } from "@/lib/mock-data";

export function CreditSelector() {
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><h2 className="text-3xl font-black text-slate-950">Créditos claros desde el inicio</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{pricingPacks.map((pack) => <Card key={pack.name} variant={pack.featured ? "gradient" : "default"}><p className="font-black text-slate-950">{pack.name}</p><p className="mt-3 text-3xl font-black">{pack.credits.toLocaleString("es-ES")}</p><p className="text-sm text-slate-500">créditos · {pack.price}</p></Card>)}</div></section>;
}
