"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShopifyConnectForm() {
  const [shop, setShop] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function connect() { setError(null); const response = await fetch("/api/integrations/shopify/connect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ shop }) }); const data = await response.json(); if (!response.ok) { setError(data.error ?? "No se pudo iniciar OAuth Shopify"); return; } window.location.href = data.url; }
  return <div className="rounded-3xl border border-slate-200 bg-white p-5"><label className="text-sm font-bold text-slate-700">Dominio myshopify.com</label><div className="mt-2 flex flex-col gap-3 md:flex-row"><input className="min-h-11 flex-1 rounded-2xl border border-slate-200 px-4" placeholder="tu-tienda.myshopify.com" value={shop} onChange={(event) => setShop(event.target.value)} /><Button type="button" onClick={connect}>Conectar solo lectura</Button></div>{error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}<p className="mt-3 text-sm text-slate-500">Rankelia solicita inicialmente solo <strong>read_products</strong>. No publicamos ni modificamos tu tienda en este flujo.</p></div>;
}
