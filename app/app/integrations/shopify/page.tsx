import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShopifyConnectForm } from "@/components/app/integrations/ShopifyConnectForm";
import { getCurrentUserContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { isShopifyEnabled, listShopifyStores } from "@/lib/shopify";

export default async function ShopifyIntegrationPage() {
  const context = await getCurrentUserContext();
  const enabled = isShopifyEnabled();
  const stores = context.user && enabled && process.env.SUPABASE_SERVICE_ROLE_KEY ? await listShopifyStores(createServiceClient(), context.user.id) : [];
  return <div className="space-y-6"><Card variant="elevated"><Badge variant="info">Shopify read/import</Badge><h1 className="mt-3 text-3xl font-black">Importa productos desde Shopify</h1><p className="mt-2 max-w-3xl text-slate-600">Conecta una tienda en modo solo lectura, sincroniza productos con GraphQL Admin API y conviértelos en catálogo Rankelia para generar propuestas revisables. La escritura en Shopify queda desactivada hasta el flujo de change sets y rollback.</p></Card>{!enabled ? <Card><Badge variant="warning">No configurado</Badge><p className="mt-3 text-slate-600">Shopify no está activado en este entorno. Configura las variables SHOPIFY_* para habilitar OAuth y sync.</p></Card> : <ShopifyConnectForm />}{stores.length ? <Card><h2 className="text-xl font-black">Tiendas conectadas</h2><div className="mt-4 grid gap-3">{stores.map((store) => <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center" key={store.id}><div><p className="font-black">{store.store_name ?? store.myshopify_domain}</p><p className="text-sm text-slate-500">Estado: {store.status} · Último sync: {store.last_sync_at ?? "sin sincronizar"}</p></div><Button href={`/app/integrations/shopify/${store.id}`} variant="secondary">Ver tienda</Button></div>)}</div></Card> : null}</div>;
}
