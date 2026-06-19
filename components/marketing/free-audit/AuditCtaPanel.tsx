import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AuditCtaPanel() {
  return <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-violet-50"><h4 className="text-2xl font-black">Convierte hallazgos en contenido SEO por producto</h4><p className="mt-3 text-slate-600">La auditoría revisa señales públicas básicas. El siguiente paso es subir tu CSV para generar metadatos, descripciones, ALT text y warnings por fila.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Button href="/login?mode=register&next=/app/upload">Subir catálogo CSV</Button><Button href="/login?mode=register" variant="secondary">Crear cuenta y guardar</Button><Button disabled variant="secondary">Search Console próximamente</Button></div></Card>;
}
