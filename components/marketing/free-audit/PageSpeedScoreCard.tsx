import { Card } from "@/components/ui/Card";

export function PageSpeedScoreCard({ label, score }: { label: string; score: number | null }) {
  const display = score ?? 0;
  const color = score === null ? "text-slate-400" : display >= 80 ? "text-emerald-600" : display >= 50 ? "text-amber-600" : "text-red-600";
  return <Card className="p-5"><p className="text-sm font-bold uppercase text-slate-500">{label}</p><p className={`mt-2 text-4xl font-black ${color}`}>{score === null ? "—" : display}</p><p className="mt-2 text-xs text-slate-500">{label.includes("Mobile") ? "Mobile pesa más en ecommerce." : "Datos de laboratorio PageSpeed."}</p></Card>;
}
