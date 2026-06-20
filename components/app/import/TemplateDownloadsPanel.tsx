"use client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
const templates = ["generic", "shopify", "woocommerce", "prestashop", "fashion", "electronics", "industrial"];
export function TemplateDownloadsPanel() { return <Card><h2 className="text-xl font-black">Plantillas descargables</h2><p className="mt-2 text-sm text-slate-600">Usa estas plantillas si tu tienda o ERP no exporta un formato compatible. Puedes rellenarlas en Excel o Google Sheets y subirlas a Rankelia.</p><div className="mt-4 flex flex-wrap gap-2">{templates.map((template) => <Button href={`/api/app/import/templates/${template}`} key={template} variant="secondary">{template}</Button>)}</div></Card>; }
