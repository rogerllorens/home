import { Card } from "@/components/ui/Card";

export function AuditScoreCard({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";
  return <Card className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-3xl font-black ${color}`}>{score}</p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${Math.max(4, Math.min(100, score))}%` }} /></div></Card>;
}
