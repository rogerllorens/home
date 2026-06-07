import { Card } from "@/components/ui/Card";
import { getExtraProductPacks, formatPricePerProduct } from "@/lib/pricing";

export function CreditSelector() {
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><h2 className="text-3xl font-black text-slate-950">Productos extra cuando tu catálogo crece</h2><p className="mt-3 text-slate-600">Los créditos quedan como unidad interna; el usuario compra productos SEO revisables.</p><div className="mt-6 grid gap-5 md:grid-cols-3">{getExtraProductPacks().slice(0, 6).map((pack) => <Card key={pack.quantity}><p className="font-black text-slate-950">{pack.quantity.toLocaleString("es-ES")} productos extra</p><p className="mt-3 text-3xl font-black">{pack.price} €</p><p className="text-sm text-slate-500">{formatPricePerProduct(pack)}</p></Card>)}</div></section>;
}
