"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table, Td } from "@/components/ui/Table";
import { useAppState } from "@/components/app/AppStateProvider";
import { getUserBillingData, type CheckoutSessionRow, type SubscriptionRow } from "@/lib/db/billing";
import { getSubscriptionPlans, getPlanInternalCredits, getExtraProductPacks } from "@/lib/pricing";

function statusVariant(status?: string): "success" | "warning" | "danger" | "info" | "default" { if (status === "active") return "success"; if (status === "trialing") return "info"; if (["past_due", "incomplete", "unpaid"].includes(status ?? "")) return "warning"; if (["canceled", "cancelled"].includes(status ?? "")) return "danger"; return "default"; }

export function RealBillingPage() {
  const { showToast } = useAppState();
  const params = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [checkouts, setCheckouts] = useState<CheckoutSessionRow[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  async function refresh() { setLoading(true); const data = await getUserBillingData(); setSubscription(data.subscription); setCheckouts(data.checkouts); setCustomerId(data.customer?.stripe_customer_id ?? null); setLoading(false); }
  useEffect(() => {
    let active = true;
    getUserBillingData().then((data) => {
      if (!active) return;
      setSubscription(data.subscription);
      setCheckouts(data.checkouts);
      setCustomerId(data.customer?.stripe_customer_id ?? null);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (params.get("checkout") === "success") showToast("Checkout completado. El plan se actualizará cuando Stripe confirme el webhook.", "success"); if (params.get("checkout") === "cancelled") showToast("Checkout cancelado.", "warning"); }, [params, showToast]);

  async function startPlan(planId: string) { setBusy(planId); try { const response = await fetch("/api/stripe/create-checkout-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "subscription", planId }) }); const payload = await response.json(); if (!response.ok || !payload.url) throw new Error(payload.error ?? "No se pudo crear Checkout."); window.location.assign(payload.url); } catch (error) { showToast(error instanceof Error ? error.message : "Error abriendo Stripe.", "error"); } finally { setBusy(null); } }
  async function openPortal() { setBusy("portal"); try { const response = await fetch("/api/stripe/create-portal-session", { method: "POST" }); const payload = await response.json(); if (!response.ok || !payload.url) throw new Error(payload.error ?? "No se pudo abrir Portal."); window.location.assign(payload.url); } catch (error) { showToast(error instanceof Error ? error.message : "Error abriendo portal.", "error"); } finally { setBusy(null); } }

  return <div className="space-y-8"><Card variant="gradient"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><Badge variant={statusVariant(subscription?.status)}>Plan actual</Badge><h2 className="mt-4 text-3xl font-black">{subscription?.plan_id ?? "free"}</h2><p className="mt-2 text-slate-600">{subscription?.product_allowance ?? 3} productos estándar/mes · {subscription?.internal_credit_allowance ?? 1500} créditos internos · estado {subscription?.status ?? "free"}</p><p className="mt-2 text-sm text-slate-500">Renovación: {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("es-ES") : "sin ciclo activo"}</p></div><div className="flex flex-wrap gap-3"><Button onClick={refresh} variant="secondary">Refrescar</Button><Button disabled={!customerId || busy === "portal"} onClick={openPortal}>{busy === "portal" ? "Abriendo…" : "Gestionar en Stripe"}</Button><Button href="/app/credits" variant="secondary">Comprar productos extra</Button></div></div>{!customerId && <p className="mt-4 rounded-2xl bg-white/70 p-4 text-sm font-semibold text-slate-600">Aún no tienes customer en Stripe. Contrata un plan o compra productos extra para crearlo.</p>}</Card><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">{getSubscriptionPlans().map((plan) => <Card className={plan.featured ? "ring-2 ring-blue-500" : ""} key={plan.id} variant={plan.featured ? "gradient" : "default"}>{plan.featured && <Badge variant="ai">Recomendado</Badge>}<h3 className="mt-3 text-2xl font-black">{plan.name}</h3><p className="mt-2 text-4xl font-black">{plan.price}</p><p className="mt-2 font-semibold text-blue-700">{plan.monthlyProducts.toLocaleString("es-ES")} productos/mes</p><p className="mt-1 text-xs text-slate-500">{getPlanInternalCredits(plan.id).toLocaleString("es-ES")} créditos internos</p><p className="mt-1 text-sm text-slate-500">{plan.equivalent}</p><ul className="mt-5 space-y-2 text-sm text-slate-600">{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>{plan.id === "free" ? <Button className="mt-6 w-full" disabled variant="secondary">Plan gratuito</Button> : <Button className="mt-6 w-full" disabled={Boolean(busy)} onClick={() => startPlan(plan.id)} variant={plan.featured ? "primary" : "secondary"}>{busy === plan.id ? "Abriendo Stripe…" : `Elegir ${plan.name}`}</Button>}</Card>)}</div><Card><h2 className="text-xl font-black">Productos extra también disponibles</h2><p className="mt-2 text-sm text-slate-500">Puedes comprar productos extra aunque estés en Free. No sustituyen tu plan mensual.</p><div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-5">{getExtraProductPacks().slice(0,5).map((pack) => <Card key={pack.id}><p className="font-black">{pack.quantity.toLocaleString("es-ES")} productos</p><p className="mt-2 text-2xl font-black">{pack.price} €</p><Button className="mt-4 w-full" href="/app/credits" variant="secondary">Comprar</Button></Card>)}</div></Card><Card><h2 className="mb-4 text-xl font-black">Checkout sessions recientes</h2><p className="mb-4 text-sm text-slate-500">El saldo solo cambia tras webhook confirmado, nunca desde success_url.</p><Table headers={["Fecha", "Tipo", "Item", "Productos", "Importe", "Estado"]}>{checkouts.map((session) => <tr key={session.id}><Td>{new Date(session.created_at).toLocaleString("es-ES")}</Td><Td>{session.mode}</Td><Td>{session.plan_id ?? session.extra_pack_id}</Td><Td>{session.products}</Td><Td>{session.amount_total ? `${(session.amount_total / 100).toLocaleString("es-ES")} ${session.currency.toUpperCase()}` : "—"}</Td><Td><Badge variant={session.status === "completed" ? "success" : "default"}>{session.status}</Badge></Td></tr>)}</Table>{loading && <p className="mt-3 text-sm text-slate-500">Cargando billing real…</p>}</Card></div>;
}
