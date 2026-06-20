import { Card } from "@/components/ui/Card";

export default function ShopifyChangeSetsPage() {
  return <div className="space-y-6"><h1 className="text-3xl font-semibold">Cambios Shopify</h1><Card><p>Revisa change sets creados desde propuestas aprobadas. Ejecuta dry run antes de pedir permisos de escritura o aplicar cambios.</p><ul className="mt-4 list-disc pl-6 text-sm text-slate-600"><li>No tocamos precios, stock, variantes ni publicación.</li><li>Solo campos SEO aprobados por humanos.</li><li>Apply y rollback están desactivados si SHOPIFY_WRITE_ENABLED no es true.</li></ul></Card></div>;
}
