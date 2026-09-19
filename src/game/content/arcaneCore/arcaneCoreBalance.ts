export const ARCANE_CORE_RING_INDICES = [1, 2, 3, 4, 5, 6, 7, 8] as const
export const ARCANE_CORE_STANDARD_NODES_PER_RING = 8 as const
export const ARCANE_CORE_CORE_COUNT = 4 as const
export const ARCANE_CORE_RINGS_PER_CORE = ARCANE_CORE_RING_INDICES.length
export const ARCANE_CORE_STANDARD_RANK_COST_BY_RING = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 8, 8: 10 } as const
export const ARCANE_CORE_MAJOR_COST_BY_RING = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40 } as const
export const ARCANE_CORE_FULL_RING_COST_BY_RING = { 1: 44, 2: 88, 3: 132, 4: 176, 5: 220, 6: 264, 7: 352, 8: 440 } as const
export const ARCANE_CORE_TOTAL_COST_PER_CORE = 1716 as const
export const ARCANE_CORE_TOTAL_TREE_COST = 6864 as const
/** Compatibility aliases for selectors that describe a complete Ring/Core. */
export const ARCANE_CORE_POINTS_PER_RING = ARCANE_CORE_FULL_RING_COST_BY_RING[1]
export const ARCANE_CORE_POINTS_PER_CORE = ARCANE_CORE_TOTAL_COST_PER_CORE
export const ARCANE_CORE_TOTAL_POINTS = ARCANE_CORE_TOTAL_TREE_COST
export const ARCANE_CORE_NODE_COUNT_PER_BRANCH = ARCANE_CORE_RINGS_PER_CORE * (ARCANE_CORE_STANDARD_NODES_PER_RING + 1)
export const ARCANE_CORE_NODE_COUNT = ARCANE_CORE_NODE_COUNT_PER_BRANCH * ARCANE_CORE_CORE_COUNT

/** Legacy V36 curve, isolated for migration compatibility only. */
export const ARCANE_CORE_XP_BASE = 100
export const ARCANE_CORE_XP_EXPONENT = 1.15
export const getArcaneCoreXpForLevel = (level: number) => Math.round(ARCANE_CORE_XP_BASE * Math.max(1, Math.floor(Number.isFinite(level) ? level : 1)) ** ARCANE_CORE_XP_EXPONENT)
export const ARCANE_CORE_MAX_LEVEL = 1377
export const getArcaneCoreTotalXpForLevel = (level: number) => { const safeLevel = Math.max(1, Math.min(ARCANE_CORE_MAX_LEVEL, Math.floor(Number.isFinite(level) ? level : 1))); let total = 0; for (let current = 1; current < safeLevel; current += 1) total += getArcaneCoreXpForLevel(current); return total }
export const ARCANE_CORE_MAX_TOTAL_XP = getArcaneCoreTotalXpForLevel(ARCANE_CORE_MAX_LEVEL)
export const getArcaneCoreLevelForXp = (totalXp: number) => { const safeXp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0)); let level = 1; while (level < ARCANE_CORE_MAX_LEVEL && safeXp >= getArcaneCoreTotalXpForLevel(level + 1)) level += 1; return level }
