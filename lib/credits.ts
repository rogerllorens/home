export function estimateCredits(rows: number, outputsPerRow = 6) {
  return Math.ceil(rows * outputsPerRow * 0.35);
}

export function estimateSavingsHours(rows: number) {
  return Math.round((rows * 8) / 60);
}
