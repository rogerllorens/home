import { Card } from "@/components/ui/Card";
export default async function ShopifyApplyRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="space-y-6"><h1 className="text-3xl font-semibold">Aplicación Shopify</h1><Card><p className="text-sm text-slate-600">Apply run: {id}</p><p className="mt-3">Cada item guarda snapshot pre-apply, estado item-level, errores de Shopify y disponibilidad de rollback.</p></Card></div>;
}
