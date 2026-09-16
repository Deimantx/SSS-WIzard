/** Central tuning for Arcane Core V2. XP is intentionally integer-only. */
export const ARCANE_CORE_XP_BASE = 100
export const ARCANE_CORE_XP_EXPONENT = 1.15

export const getArcaneCoreXpForLevel = (level: number) => {
  const safeLevel = Math.max(1, Math.floor(Number.isFinite(level) ? level : 1))
  return Math.round(ARCANE_CORE_XP_BASE * safeLevel ** ARCANE_CORE_XP_EXPONENT)
}

export const ARCANE_CORE_DUNGEON_XP_REWARDS = {
  'whispering-woods': { normalKillXp: 5, bossKillXp: 40 },
  'howling-den': { normalKillXp: 6, bossKillXp: 50 },
  'abandoned-catacombs': { normalKillXp: 8, bossKillXp: 65 },
  'fractured-approach': { normalKillXp: 10, bossKillXp: 80 },
  'flooded-reliquary': { normalKillXp: 12, bossKillXp: 95 },
  'ashen-watch': { normalKillXp: 14, bossKillXp: 110 },
  'rootscar-hollow': { normalKillXp: 16, bossKillXp: 125 },
  'crossroads-of-ruin': { normalKillXp: 18, bossKillXp: 140 },
  'graveglass-hollow': { normalKillXp: 20, bossKillXp: 155 },
  'stormvault-gallery': { normalKillXp: 22, bossKillXp: 170 },
  'starfallen-observatory': { normalKillXp: 24, bossKillXp: 190 },
  'broken-meridian': { normalKillXp: 26, bossKillXp: 210 },
  'hall-of-unbound-names': { normalKillXp: 28, bossKillXp: 230 },
  'vault-of-the-black-sigil': { normalKillXp: 30, bossKillXp: 250 },
  'black-gate': { normalKillXp: 35, bossKillXp: 300 },
} as const

export const ARCANE_CORE_NODE_COUNT_PER_BRANCH = 40 as const
export const ARCANE_CORE_NODE_COUNT = ARCANE_CORE_NODE_COUNT_PER_BRANCH * 4
export const ARCANE_CORE_MAX_LEVEL = 1 + ARCANE_CORE_NODE_COUNT

export const getArcaneCoreTotalXpForLevel = (level: number) => {
  const safeLevel = Math.max(1, Math.min(ARCANE_CORE_MAX_LEVEL, Math.floor(Number.isFinite(level) ? level : 1)))
  let total = 0
  for (let current = 1; current < safeLevel; current += 1) total += getArcaneCoreXpForLevel(current)
  return total
}

export const ARCANE_CORE_MAX_TOTAL_XP = getArcaneCoreTotalXpForLevel(ARCANE_CORE_MAX_LEVEL)

export const getArcaneCoreLevelForXp = (totalXp: number) => {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0))
  let level = 1
  while (level < ARCANE_CORE_MAX_LEVEL && safeXp >= getArcaneCoreTotalXpForLevel(level + 1)) level += 1
  return level
}
