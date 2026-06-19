import { getScoreClasses, getScoreLevel } from "@/lib/seo-score";
import { cn } from "@/lib/utils";

export function ScoreBadge({ score, compact = false }: { score: number; compact?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full bg-gradient-to-br px-3 py-1.5 text-sm font-bold", getScoreClasses(score))}>
      <span>{score}</span>
      {!compact && <span className="text-xs font-semibold uppercase tracking-wide opacity-90">{getScoreLevel(score)}</span>}
    </div>
  );
}
