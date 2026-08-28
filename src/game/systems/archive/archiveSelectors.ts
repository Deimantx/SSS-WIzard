/** Returns a bounded whole-number completion percentage for archive counters. */
export const completionPercent = (discovered: number, total: number) => {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round(discovered / total * 100)))
}
