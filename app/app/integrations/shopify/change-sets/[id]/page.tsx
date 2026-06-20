import { Card } from "@/components/ui/Card";
export default async function ShopifyChangeSetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="space-y-6"><h1 className="text-3xl font-semibold">Change set Shopify</h1><Card><p className="text-sm text-slate-600">ID: {id}</p><h2 className="mt-4 font-semibold">Flujo seguro</h2><ol className="mt-2 list-decimal pl-6 text-sm text-slate-600"><li>Crear desde versiones aprobadas.</li><li>Ejecutar dry run sin escritura.</li><li>Conceder write_products solo si vas a aplicar.</li><li>Confirmar “APLICAR CAMBIOS”.</li><li>Revertir con snapshot y “REVERTIR CAMBIOS” si hace falta.</li></ol></Card></div>;
}
