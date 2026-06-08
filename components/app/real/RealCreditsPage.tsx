"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table, Td } from "@/components/ui/Table";
import { useAppState } from "@/components/app/AppStateProvider";
import { getUserBillingData, type SubscriptionRow } from "@/lib/db/billing";
import { getExtraProductPacks, formatPricePerProduct, getVisibleProductCountFromCredits, getRecommendedPackForDeficit, PRODUCT_STANDARD_CREDITS } from "@/lib/pricing";
import type { CreditReservationRow, CreditTransactionRow, WalletRow } from "@/lib/billing/credits";

export function RealCreditsPage() {
  const { showToast } = useAppState();
  const params = useSearchParams();
  const packs = getExtraProductPacks();
  const [packIndex, setPackIndex] = useState(2);
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [transactions, setTransactions] = useState<CreditTransactionRow[]>([]);
  const [reservations, setReservations] = useState<CreditReservationRow[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const pack = packs[packIndex];
  const recommended = useMemo(() => getRecommendedPackForDeficit(Math.max(0, 50000 - (wallet?.balance ?? 0))), [wallet?.balance]);

  async function refresh() { setLoading(true); const data = await getUserBillingData(); setWallet(data.wallet); setTransactions(data.transactions); setReservations(data.reservations); setSubscription(data.subscription); setLoading(false); }
  useEffect(() => {
    let active = true;
    getUserBillingData().then((data) => {
      if (!active) return;
      setWallet(data.wallet);
      setTransactions(data.transactions);
      setReservations(data.reservations);
      setSubscription(data.subscription);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (params.get("checkout") === "success") showToast("Pago recibido. Tus productos se actualizarán cuando Stripe confirme el webhook.", "success"); if (params.get("checkout") === "cancelled") showToast("Checkout cancelado. No se ha añadido saldo.", "warning"); }, [params, showToast]);

  async function startCheckout(packId: string) {
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "extra_products", packId }) });
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "No se pudo crear Checkout.");
      window.location.assign(payload.url);
    } catch (error) { showToast(error instanceof Error ? error.message : "Error iniciando Stripe Checkout.", "error"); }
    finally { setCheckoutLoading(false); }
  }

  const balance = wallet?.balance ?? 0;
  const reserved = wallet?.reserved_balance ?? 0;
  return <div className="space-y-8"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Card><p className="text-sm text-slate-500">Productos estándar disponibles</p><p className="mt-2 text-3xl font-black">{getVisibleProductCountFromCredits(balance).toLocaleString("es-ES")}</p><p className="text-xs text-slate-500">{balance.toLocaleString("es-ES")} créditos internos</p></Card><Card><p className="text-sm text-slate-500">Pro equivalentes</p><p className="mt-2 text-3xl font-black">{Math.floor(balance / 1000).toLocaleString("es-ES")}</p></Card><Card><p className="text-sm text-slate-500">Premium equivalentes</p><p className="mt-2 text-3xl font-black">{Math.floor(balance / 2000).toLocaleString("es-ES")}</p></Card><Card><p className="text-sm text-slate-500">Reservado jobs activos</p><p className="mt-2 text-3xl font-black">{getVisibleProductCountFromCredits(reserved).toLocaleString("es-ES")}</p><p className="text-xs text-slate-500">{reserved.toLocaleString("es-ES")} créditos</p></Card><Card><p className="text-sm text-slate-500">Plan</p><p className="mt-2 text-3xl font-black">{subscription?.plan_id ?? "free"}</p><Badge variant={subscription?.status === "active" ? "success" : "default"}>{subscription?.status ?? "free"}</Badge></Card></div><Card variant="gradient"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><Badge variant="ai">Productos extra reales</Badge><h2 className="mt-4 text-2xl font-black">Comprar productos SEO extra</h2><p className="mt-2 text-slate-600">Stripe Checkout confirma el pago; el webhook añade créditos internos a tu wallet. El success_url nunca concede saldo.</p></div><Button onClick={refresh} variant="secondary">Refrescar saldo</Button></div><input className="mt-6 w-full accent-blue-600" max={packs.length - 1} min={0} onChange={(event) => setPackIndex(Number(event.target.value))} step={1} type="range" value={packIndex} /><div className="mt-6 grid gap-5 md:grid-cols-4"><div><p className="text-5xl font-black">{pack.price} €</p><p className="mt-2 font-bold text-blue-700">{pack.quantity.toLocaleString("es-ES")} productos extra</p><p className="text-sm text-slate-600">{formatPricePerProduct(pack)} · {pack.recommendedFor}</p><p className="mt-2 text-xs text-slate-500">{pack.internalCredits.toLocaleString("es-ES")} créditos internos</p><Button className="mt-5" disabled={checkoutLoading} onClick={() => startCheckout(pack.id)}>{checkoutLoading ? "Abriendo Stripe…" : "Comprar productos extra"}</Button></div>{[["Estándar", pack.quantity], ["Pro", Math.floor(pack.quantity / 2)], ["Premium", Math.floor(pack.quantity / 4)]].map(([label, value]) => <Card key={String(label)}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">~{Number(value).toLocaleString("es-ES")}</p></Card>)}</div>{recommended && <p className="mt-4 text-sm font-semibold text-slate-600">Pack recomendado para lotes medianos: {recommended.quantity.toLocaleString("es-ES")} productos por {recommended.price} €.</p>}</Card><Card><h2 className="text-xl font-black">Historial real de uso y compras</h2><p className="mb-4 mt-2 text-sm text-slate-500">{loading ? "Cargando…" : "Compras, grants de suscripción, reservas, consumos y liberaciones."}</p><Table headers={["Fecha", "Tipo", "Descripción", "Productos", "Créditos", "Saldo", "Estado"]}>{transactions.map((tx) => <tr key={tx.id}><Td>{new Date(tx.created_at).toLocaleString("es-ES")}</Td><Td><Badge variant={tx.amount >= 0 ? "success" : "warning"}>{tx.type}</Badge></Td><Td>{tx.description ?? "—"}</Td><Td>{Number(tx.product_equivalent ?? tx.amount / PRODUCT_STANDARD_CREDITS).toLocaleString("es-ES")}</Td><Td>{tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("es-ES")}</Td><Td>{tx.balance_after?.toLocaleString("es-ES") ?? "—"}</Td><Td>{tx.status}</Td></tr>)}</Table></Card><Card><h2 className="text-xl font-black">Reservas activas y recientes</h2><Table headers={["Job", "Productos", "Créditos", "Estado", "Creada", "Final"]}>{reservations.map((reservation) => <tr key={reservation.id}><Td><code>{reservation.job_id.slice(0, 8)}</code></Td><Td>{Number(reservation.product_equivalent ?? reservation.amount / PRODUCT_STANDARD_CREDITS).toLocaleString("es-ES")}</Td><Td>{reservation.amount.toLocaleString("es-ES")}</Td><Td><Badge variant={reservation.status === "reserved" ? "info" : reservation.status === "consumed" ? "success" : "warning"}>{reservation.status}</Badge></Td><Td>{new Date(reservation.created_at).toLocaleDateString("es-ES")}</Td><Td>{reservation.consumed_at ?? reservation.released_at ? new Date(reservation.consumed_at ?? reservation.released_at ?? "").toLocaleDateString("es-ES") : "—"}</Td></tr>)}</Table></Card></div>;
}
