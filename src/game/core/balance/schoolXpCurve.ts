/** Authored Magic School progression curve. Values are intentionally explicit for easy balancing. */
export const SCHOOL_MAX_LEVEL = 40

/** Incremental XP required while at each level to reach the next level. */
export const SCHOOL_XP_TO_NEXT = {
  1: 100,
  2: 140,
  3: 180,
  4: 250,
  5: 340,
  6: 460,
  7: 600,
  8: 770,
  9: 960,
  10: 1180,
  11: 1430,
  12: 1700,
  13: 2000,
  14: 2330,
  15: 2680,
  16: 3060,
  17: 3460,
  18: 3890,
  19: 4340,
  20: 4820,
  21: 5330,
  22: 5860,
  23: 6420,
  24: 7010,
  25: 7620,
  26: 8260,
  27: 8920,
  28: 9610,
  29: 10320,
  30: 11060,
  31: 11830,
  32: 12620,
  33: 13440,
  34: 14290,
  35: 15160,
  36: 16060,
  37: 16980,
  38: 17930,
  39: 18900,
} as const

const clampLevel = (level: number) => Number.isFinite(level)
  ? Math.min(SCHOOL_MAX_LEVEL, Math.max(1, Math.floor(level)))
  : 1

const totalXpByLevel: Record<number, number> = { 1: 0 }
for (let level = 1; level < SCHOOL_MAX_LEVEL; level += 1) {
  totalXpByLevel[level + 1] = totalXpByLevel[level] + SCHOOL_XP_TO_NEXT[level as keyof typeof SCHOOL_XP_TO_NEXT]
}

/** Incremental XP required from the supplied level, or null at the authored cap. */
export const getSchoolXpToNext = (level: number): number | null => {
  const safeLevel = clampLevel(level)
  return safeLevel >= SCHOOL_MAX_LEVEL ? null : SCHOOL_XP_TO_NEXT[safeLevel as keyof typeof SCHOOL_XP_TO_NEXT]
}

/** Absolute cumulative XP threshold at the start of the supplied level. */
export const getSchoolTotalXpForLevel = (level: number): number => totalXpByLevel[clampLevel(level)]

/** Derives a School level from total XP, respecting the current gameplay cap. */
export const getSchoolLevelFromXp = (xp: number, cap: number): number => {
  const safeCap = Math.min(SCHOOL_MAX_LEVEL, Math.max(1, Number.isFinite(cap) ? Math.floor(cap) : 1))
  const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0
  let level = 1
  for (let nextLevel = 2; nextLevel <= safeCap; nextLevel += 1) {
    if (safeXp < getSchoolTotalXpForLevel(nextLevel)) break
    level = nextLevel
  }
  return level
}
