export const COMBAT_LOCATION_IDS = [
  'stonewake-hollow', 'galecrest-heights', 'tideglass-caverns', 'emberfall-basin',
  'whispering-woods', 'howling-den', 'hunters-ground', 'abandoned-catacombs',
  'fractured-approach', 'flooded-reliquary', 'ashen-watch', 'rootscar-hollow', 'crossroads-of-ruin',
  'graveglass-hollow', 'stormvault-gallery', 'starfallen-observatory', 'broken-meridian',
  'hall-of-unbound-names', 'vault-of-the-black-sigil', 'black-gate',
  'brineveil-marsh', 'cinderwild-expanse', 'skybreak-cliffs', 'runeblight-expanse',
  'pyrehold-bastion', 'abyssal-reservoir', 'scalding-rift',
  'mistclaw-highlands', 'cinderhex-barrens',
  'cinder-sepulcher', 'temple-of-the-sunken-bell', 'stormspire-monastery', 'nullstone-archive',
] as const

export type CombatLocationId = typeof COMBAT_LOCATION_IDS[number]
const combatLocationIdSet: ReadonlySet<string> = new Set(COMBAT_LOCATION_IDS)
export const isCombatLocationId = (value: unknown): value is CombatLocationId => typeof value === 'string' && combatLocationIdSet.has(value)
