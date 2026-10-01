export const COMBAT_LOCATION_IDS = [
  'stonewake-hollow', 'galecrest-heights', 'tideglass-caverns', 'emberfall-basin',
  'whispering-woods', 'howling-den', 'hunters-ground', 'abandoned-catacombs',
  'fractured-approach', 'flooded-reliquary', 'ashen-watch', 'rootscar-hollow', 'crossroads-of-ruin',
  'graveglass-hollow', 'stormvault-gallery', 'starfallen-observatory', 'broken-meridian',
  'hall-of-unbound-names', 'vault-of-the-black-sigil', 'black-gate',
] as const

export type CombatLocationId = typeof COMBAT_LOCATION_IDS[number]
const combatLocationIdSet: ReadonlySet<string> = new Set(COMBAT_LOCATION_IDS)
export const isCombatLocationId = (value: unknown): value is CombatLocationId => typeof value === 'string' && combatLocationIdSet.has(value)

export const COMBAT_REGION_IDS = ['first-frontier', 'elemental-scar', 'shattered-meridian', 'black-sigil-reach'] as const
export type CombatRegionId = typeof COMBAT_REGION_IDS[number]
