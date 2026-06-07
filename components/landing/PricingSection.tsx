import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSubscriptionPlans } from "@/lib/pricing";

export function PricingSection() {
  return <section id="precios" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="text-center"><Badge variant="ai">Pricing por productos</Badge><h2 className="mt-4 text-3xl font-black text-slate-950 md:text-4xl">Planes para optimizar productos ecommerce desde CSV</h2></div><div className="mt-8 grid gap-5 md:grid-cols-3 xl:grid-cols-5">{getSubscriptionPlans().map((plan) => <Card className={plan.featured ? "ring-2 ring-blue-500" : ""} key={plan.id} variant={plan.featured ? "elevated" : "default"}><h3 className="text-xl font-black">{plan.name}</h3><p className="mt-2 text-slate-600">{plan.ideal}</p><p className="mt-6 text-4xl font-black">{plan.price}</p><p className="mt-2 font-bold text-blue-700">{plan.monthlyProducts.toLocaleString("es-ES")} productos/mes</p><Button className="mt-6 w-full" href="/login?mode=register&intent=plan" variant={plan.featured ? "primary" : "secondary"}>Elegir plan</Button></Card>)}</div></section>;
}
