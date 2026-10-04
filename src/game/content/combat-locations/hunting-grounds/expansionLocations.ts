import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'
import { authorTargetedLocation } from '../authoring'

export const expansionHuntingGroundLocations = {
  'mistclaw-highlands': authorTargetedLocation('mistclaw-highlands', 8, 'Mistclaw Highlands', 'Cold, wet hunting country of mist, cliff streams and roaming magical beasts.', 'hunting-ground', null, { type: 'boss-kill', bossId: 'corrupted-greatbear' }),
  'cinderhex-barrens': authorTargetedLocation('cinderhex-barrens', 20, 'Cinderhex Barrens', 'Open burned hunting country scarred by old Arcane fires.', 'hunting-ground', null, { type: 'boss-kill', bossId: 'unmade-magister' }),
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>
