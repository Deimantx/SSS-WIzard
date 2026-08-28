/** Returns a bounded whole-number completion percentage for archive counters. */
export const completionPercent = (discovered: number, total: number) => total <= 0 ? 0 : Math.round(discovered / total * 100)
