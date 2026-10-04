import type { CombatProgressionMetadata, CombatTier, CombatLocationDefinition, CombatLocationId } from './worldNavigationTypes'
import { MONSTERS } from '../monsters'

type StandingId = 'tracker-1' | 'warden-1' | 'veteran-1' | 'master-hunter-1'
type Slot = Pick<CombatProgressionMetadata, 'tier' | 'locationType' | 'element' | 'progressionRole' | 'mandatoryForTierProgression'> & { hunterStanding?: StandingId }

/** Canonical T1-T5 content matrix. Runtime encounter mechanics remain on `location.type`. */
const PROGRESSION_SLOTS: Record<CombatLocationId, Slot> = {
  'stonewake-hollow': { tier: 1, locationType: 'combat-zone', element: 'earth', progressionRole: 'standard', mandatoryForTierProgression: false },
  'galecrest-heights': { tier: 1, locationType: 'combat-zone', element: 'air', progressionRole: 'standard', mandatoryForTierProgression: false },
  'tideglass-caverns': { tier: 1, locationType: 'combat-zone', element: 'water', progressionRole: 'standard', mandatoryForTierProgression: false },
  'emberfall-basin': { tier: 1, locationType: 'combat-zone', element: 'fire', progressionRole: 'standard', mandatoryForTierProgression: false },
  'whispering-woods': { tier: 2, locationType: 'combat-zone', element: 'earth', progressionRole: 'standard', mandatoryForTierProgression: false },
  'brineveil-marsh': { tier: 2, locationType: 'combat-zone', element: 'water', progressionRole: 'standard', mandatoryForTierProgression: false },
  'cinderwild-expanse': { tier: 2, locationType: 'combat-zone', element: 'fire', progressionRole: 'standard', mandatoryForTierProgression: false },
  'skybreak-cliffs': { tier: 2, locationType: 'combat-zone', element: 'air', progressionRole: 'standard', mandatoryForTierProgression: false },
  'flooded-reliquary': { tier: 3, locationType: 'combat-zone', element: 'water', progressionRole: 'standard', mandatoryForTierProgression: false },
  'ashen-watch': { tier: 3, locationType: 'combat-zone', element: 'fire', progressionRole: 'standard', mandatoryForTierProgression: false },
  'rootscar-hollow': { tier: 3, locationType: 'combat-zone', element: 'earth', progressionRole: 'standard', mandatoryForTierProgression: false },
  'runeblight-expanse': { tier: 3, locationType: 'combat-zone', element: 'air', progressionRole: 'standard', mandatoryForTierProgression: false },
  'stormvault-gallery': { tier: 4, locationType: 'combat-zone', element: 'air', progressionRole: 'standard', mandatoryForTierProgression: false },
  'graveglass-hollow': { tier: 4, locationType: 'combat-zone', element: 'earth', progressionRole: 'standard', mandatoryForTierProgression: false },
  'starfallen-observatory': { tier: 4, locationType: 'combat-zone', element: 'fire', progressionRole: 'standard', mandatoryForTierProgression: false },
  'hall-of-unbound-names': { tier: 4, locationType: 'combat-zone', element: 'water', progressionRole: 'standard', mandatoryForTierProgression: false },
  'pyrehold-bastion': { tier: 5, locationType: 'combat-zone', element: 'fire', progressionRole: 'standard', mandatoryForTierProgression: false },
  'vault-of-the-black-sigil': { tier: 5, locationType: 'combat-zone', element: 'earth', progressionRole: 'standard', mandatoryForTierProgression: false },
  'stormspire-monastery': { tier: 5, locationType: 'combat-zone', element: 'air', progressionRole: 'standard', mandatoryForTierProgression: false },
  'abyssal-reservoir': { tier: 5, locationType: 'combat-zone', element: 'water', progressionRole: 'standard', mandatoryForTierProgression: false },

  'hunters-ground': { tier: 1, locationType: 'hunting-ground', element: 'mixed', progressionRole: 'hunting', mandatoryForTierProgression: false, hunterStanding: 'tracker-1' },
  'mistclaw-highlands': { tier: 2, locationType: 'hunting-ground', element: 'mixed', progressionRole: 'hunting', mandatoryForTierProgression: false, hunterStanding: 'warden-1' },
  'cinderhex-barrens': { tier: 3, locationType: 'hunting-ground', element: 'mixed', progressionRole: 'hunting', mandatoryForTierProgression: false, hunterStanding: 'warden-1' },
  'cinder-sepulcher': { tier: 4, locationType: 'hunting-ground', element: 'mixed', progressionRole: 'hunting', mandatoryForTierProgression: false, hunterStanding: 'veteran-1' },
  'temple-of-the-sunken-bell': { tier: 5, locationType: 'hunting-ground', element: 'mixed', progressionRole: 'hunting', mandatoryForTierProgression: false, hunterStanding: 'master-hunter-1' },

  'abandoned-catacombs': { tier: 1, locationType: 'dungeon', element: 'mixed', progressionRole: 'dungeon', mandatoryForTierProgression: true },
  'fractured-approach': { tier: 2, locationType: 'dungeon', element: 'mixed', progressionRole: 'dungeon', mandatoryForTierProgression: true },
  'crossroads-of-ruin': { tier: 3, locationType: 'dungeon', element: 'mixed', progressionRole: 'dungeon', mandatoryForTierProgression: true },
  'broken-meridian': { tier: 4, locationType: 'dungeon', element: 'mixed', progressionRole: 'dungeon', mandatoryForTierProgression: true },
  'black-gate': { tier: 5, locationType: 'dungeon', element: 'mixed', progressionRole: 'dungeon', mandatoryForTierProgression: true },

  'howling-den': { tier: 1, locationType: 'special', element: 'mixed', progressionRole: 'special', mandatoryForTierProgression: false },
  'scalding-rift': { tier: 5, locationType: 'special', element: 'mixed', progressionRole: 'special', mandatoryForTierProgression: false },
  'nullstone-archive': { tier: 5, locationType: 'special', element: 'arcane', progressionRole: 'special', mandatoryForTierProgression: false },
}

const TIER_GATE_DUNGEON: Partial<Record<CombatTier, CombatLocationId>> = {
  2: 'abandoned-catacombs', 3: 'fractured-approach', 4: 'crossroads-of-ruin', 5: 'broken-meridian',
}

export const getCombatProgressionMetadata = (location: CombatLocationDefinition): CombatProgressionMetadata => {
  const slot = PROGRESSION_SLOTS[location.id]
  if (!slot) throw new Error(`Missing Combat progression slot: ${location.id}`)
  const unlocksTier = slot.locationType === 'dungeon' && slot.tier < 5 ? (slot.tier + 1) as CombatTier : undefined
  return {
    ...slot,
    progressionOrder: location.progressionOrder,
    ...(slot.tier > 1 ? { requiredTier: slot.tier, ...(TIER_GATE_DUNGEON[slot.tier] ? { requiredDungeonClear: TIER_GATE_DUNGEON[slot.tier] } : {}) } : {}),
    ...(slot.locationType === 'hunting-ground' ? { requiredHunterOrderRank: slot.hunterStanding } : {}),
    ...(unlocksTier ? { unlocksTier } : {}),
  }
}

export const getCombatZonesForTier = (tier: CombatTier, locations: readonly CombatLocationDefinition[]): CombatLocationDefinition[] => locations.filter((location) => { const metadata = getCombatProgressionMetadata(location); return metadata.tier === tier && metadata.locationType === 'combat-zone' })
export const getHuntingGroundForTier = (tier: CombatTier, locations: readonly CombatLocationDefinition[]): CombatLocationDefinition | null => locations.find((location) => { const metadata = getCombatProgressionMetadata(location); return metadata.tier === tier && metadata.locationType === 'hunting-ground' }) ?? null
export const getDungeonForTier = (tier: CombatTier, locations: readonly CombatLocationDefinition[]): CombatLocationDefinition | null => locations.find((location) => { const metadata = getCombatProgressionMetadata(location); return metadata.tier === tier && metadata.locationType === 'dungeon' }) ?? null
export const getLocationsForTier = (tier: CombatTier, locations: readonly CombatLocationDefinition[]): CombatLocationDefinition[] => locations.filter((location) => getCombatProgressionMetadata(location).tier === tier)

export const getProgressionElementCounts = (location: CombatLocationDefinition) => {
  const ids = location.monsterPool
  const counts = { fire: 0, earth: 0, air: 0, water: 0, arcane: 0 }
  ids.forEach((id) => { const element = MONSTERS[id]?.primaryAffinity; if (element in counts) counts[element as keyof typeof counts] += 1 })
  return counts
}
