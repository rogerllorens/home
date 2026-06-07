import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { demoCredits } from "@/lib/mock-data";

export function CreditsPanel() {
  return <Card variant="gradient"><h2 className="text-2xl font-black">Créditos disponibles: {demoCredits.available.toLocaleString("es-ES")}</h2><p className="mt-2 text-slate-600">Usados este mes: {demoCredits.usedThisMonth.toLocaleString("es-ES")} · Reservados: {demoCredits.reserved.toLocaleString("es-ES")}</p><ProgressBar className="mt-5" value={62} status="info" /><p className="mt-3 text-sm font-semibold text-slate-500">Próxima renovación mock: {demoCredits.nextRenewal}</p></Card>;
}
