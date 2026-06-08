"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Td } from "@/components/ui/Table";
import { useAppState } from "@/components/app/AppStateProvider";
import { getUserDownloads, type DownloadRecord } from "@/lib/db/downloads";

export function RealDownloadsPage() {
  const { showToast } = useAppState();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getUserDownloads().then((result) => { if (result.error) showToast(result.error.message, "error"); setDownloads(result.data ?? []); setLoading(false); }); }, [showToast]);
  async function open(download: DownloadRecord) { const response = await fetch(`/api/downloads/${download.id}/signed-url`); const result = await response.json(); if (!response.ok || !result.signedUrl) return showToast(result.error ?? "No se pudo crear signed URL.", "error"); window.open(result.signedUrl, "_blank", "noopener,noreferrer"); showToast("Enlace temporal privado creado.", "success"); }
  if (loading) return <Card><p className="font-bold text-slate-600">Cargando descargas reales…</p></Card>;
  return <div className="space-y-8"><div className="grid gap-4 md:grid-cols-3"><Card><p className="text-sm text-slate-500">Descargas reales</p><p className="mt-2 text-3xl font-black">{downloads.length}</p></Card><Card><p className="text-sm text-slate-500">CSV</p><p className="mt-2 text-3xl font-black">{downloads.filter((d) => d.file_type.includes("csv")).length}</p></Card><Card><p className="text-sm text-slate-500">Informes</p><p className="mt-2 text-3xl font-black">{downloads.filter((d) => d.file_type.includes("report")).length}</p></Card></div>{downloads.length ? <Card><Table headers={["Archivo", "Tipo", "Filas", "Score", "Productos", "Fecha", "Acción"]}>{downloads.map((download) => <tr key={download.id}><Td><b>{download.filename}</b></Td><Td><Badge variant="info">{download.file_type.replace("rankelia_csv", "Rankelia CSV").replace("shopify_csv", "Shopify CSV").replace("woocommerce_csv", "WooCommerce CSV").replace("prestashop_csv", "PrestaShop CSV").replace("html_report", "HTML report").replace("txt_report", "TXT report")}</Badge></Td><Td>{download.rows_count}</Td><Td>{download.average_score ?? "—"}</Td><Td>{download.product_equivalent_used ?? "—"}</Td><Td>{new Date(download.created_at).toLocaleDateString("es-ES")}</Td><Td><Button onClick={() => open(download)} variant="secondary">Descargar</Button></Td></tr>)}</Table></Card> : <EmptyState title="Todavía no tienes descargas reales" description="Cuando el worker procese tu CSV aparecerán aquí Rankelia CSV, el CSV de plataforma elegido, HTML/TXT report y errors CSV si aplica, siempre con signed URLs privadas." icon="↓" action={<Button href="/app/upload">Subir CSV</Button>} />}</div>;
}
