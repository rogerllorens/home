import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getCurrentUserContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export default async function ShopifyStorePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params; const context = await getCurrentUserContext();
  const store = context.user && process.env.SUPABASE_SERVICE_ROLE_KEY ? (await createServiceClient().from("shopify_stores").select("id,myshopify_domain,store_name,status,granted_scopes,last_sync_at,last_error").eq("id", storeId).eq("user_id", context.user.id).maybeSingle()).data : null;
  const runs = context.user && process.env.SUPABASE_SERVICE_ROLE_KEY ? (await createServiceClient().from("shopify_sync_runs").select("id,status,products_seen,products_created,products_updated,error_message,created_at,finished_at").eq("store_id", storeId).eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(10)).data ?? [] : [];
  if (!store) return <Card><Badge variant="danger">No encontrado</Badge><p className="mt-3">No se encontró esta tienda Shopify para tu usuario.</p></Card>;
  return <div className="space-y-6"><Card variant="elevated"><Badge variant="success">Solo lectura</Badge><h1 className="mt-3 text-3xl font-black">{store.store_name ?? store.myshopify_domain}</h1><p className="mt-2 text-slate-600">Scopes: {(store.granted_scopes as string[] | null)?.join(", ") || "read_products"}</p><div className="mt-4 flex gap-3"><Button href="/app/upload?source=shopify">Crear import desde Shopify</Button><Button variant="secondary" href="/app/catalog">Ver catálogo</Button></div></Card><Card><h2 className="text-xl font-black">Sync runs</h2><div className="mt-4 space-y-2">{runs.map((run) => <div className="rounded-2xl border p-3" key={run.id}><p className="font-bold">{run.status} · {run.products_seen} productos</p><p className="text-sm text-slate-500">{run.error_message ?? run.finished_at ?? run.created_at}</p></div>)}{!runs.length ? <p className="text-sm text-slate-500">Aún no hay sincronizaciones.</p> : null}</div></Card></div>;
}
