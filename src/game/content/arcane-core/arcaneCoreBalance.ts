export const ARCANE_CORE_RING_INDICES = [1, 2, 3, 4, 5, 6, 7, 8] as const
export const ARCANE_CORE_STANDARD_NODES_PER_RING = 8 as const
export const ARCANE_CORE_CORE_COUNT = 4 as const
export const ARCANE_CORE_RINGS_PER_CORE = ARCANE_CORE_RING_INDICES.length
export const ARCANE_CORE_STANDARD_RANK_COST_BY_RING = { 1: 5, 2: 30, 3: 135, 4: 545, 5: 1925, 6: 4440, 7: 6960, 8: 27920 } as const
export const ARCANE_CORE_MAJOR_COST_BY_RING = { 1: 12, 2: 144, 3: 648, 4: 2616, 5: 9240, 6: 21312, 7: 33408, 8: 134016 } as const
export const ARCANE_CORE_FULL_RING_COST_BY_RING = { 1: 212, 2: 1344, 3: 6048, 4: 24416, 5: 86240, 6: 198912, 7: 311808, 8: 1250816 } as const
export const ARCANE_CORE_TOTAL_COST_PER_CORE = 1879796 as const
export const ARCANE_CORE_TOTAL_TREE_COST = 7519184 as const
/** Compatibility aliases for selectors that describe a complete Ring/Core. */
export const ARCANE_CORE_POINTS_PER_RING = ARCANE_CORE_FULL_RING_COST_BY_RING[1]
export const ARCANE_CORE_POINTS_PER_CORE = ARCANE_CORE_TOTAL_COST_PER_CORE
export const ARCANE_CORE_TOTAL_POINTS = ARCANE_CORE_TOTAL_TREE_COST
export const ARCANE_CORE_NODE_COUNT_PER_BRANCH = ARCANE_CORE_RINGS_PER_CORE * (ARCANE_CORE_STANDARD_NODES_PER_RING + 1)
export const ARCANE_CORE_NODE_COUNT = ARCANE_CORE_NODE_COUNT_PER_BRANCH * ARCANE_CORE_CORE_COUNT
/** Runtime marker for the authored node/effect topology currently in saves. */
export const ARCANE_CORE_SCHEMA_VERSION = 8 as const

/** Literal accents used by the native custom-cursor pipeline (CSS variables are not valid cursor inputs). */
export const ARCANE_CORE_BRANCH_CURSOR_COLORS = {
  power: '#f08a74',
  vitality: '#6fd0a7',
  mana: '#8e9dff',
  control: '#b89cff',
} as const

/** Legacy V36 curve, isolated for migration compatibility only. */
export const ARCANE_CORE_XP_BASE = 100
export const ARCANE_CORE_XP_EXPONENT = 1.15
export const getArcaneCoreXpForLevel = (level: number) => Math.round(ARCANE_CORE_XP_BASE * Math.max(1, Math.floor(Number.isFinite(level) ? level : 1)) ** ARCANE_CORE_XP_EXPONENT)
export const ARCANE_CORE_MAX_LEVEL = 1377
export const getArcaneCoreTotalXpForLevel = (level: number) => { const safeLevel = Math.max(1, Math.min(ARCANE_CORE_MAX_LEVEL, Math.floor(Number.isFinite(level) ? level : 1))); let total = 0; for (let current = 1; current < safeLevel; current += 1) total += getArcaneCoreXpForLevel(current); return total }
export const ARCANE_CORE_MAX_TOTAL_XP = getArcaneCoreTotalXpForLevel(ARCANE_CORE_MAX_LEVEL)
export const getArcaneCoreLevelForXp = (totalXp: number) => { const safeXp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0)); let level = 1; while (level < ARCANE_CORE_MAX_LEVEL && safeXp >= getArcaneCoreTotalXpForLevel(level + 1)) level += 1; return level }
