export function getScoreLevel(score: number) {
  if (score >= 80) return "alto";
  if (score >= 55) return "medio";
  return "bajo";
}

export function getScoreClasses(score: number) {
  const level = getScoreLevel(score);
  if (level === "alto") return "from-emerald-500 to-cyan-500 text-white";
  if (level === "medio") return "from-amber-500 to-orange-500 text-white";
  return "from-red-500 to-amber-500 text-white";
}
