import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { demoCredits } from "@/lib/mock-data";
import { PRODUCT_STANDARD_CREDITS } from "@/lib/pricing";

export function CreditsPanel() {
  const products = Math.floor(demoCredits.available / PRODUCT_STANDARD_CREDITS);
  return <Card variant="gradient"><h2 className="text-2xl font-black">Productos disponibles: {products.toLocaleString("es-ES")}</h2><p className="mt-2 text-slate-600">Uso interno: {demoCredits.available.toLocaleString("es-ES")} créditos · Reservados: {demoCredits.reserved.toLocaleString("es-ES")}</p><ProgressBar className="mt-5" value={62} status="info" /><p className="mt-3 text-sm font-semibold text-slate-500">Próxima renovación mock: {demoCredits.nextRenewal}</p></Card>;
}
