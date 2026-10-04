import type { CombatProgressionMetadata, CombatTier, CombatLocationDefinition, CombatLocationId } from './worldNavigationTypes'

type Slot = Pick<CombatProgressionMetadata, 'tier' | 'locationType' | 'progressionRole' | 'mandatoryForTierProgression'>

// The twenty standard/elite encounter areas make the elemental-zone slots.
// Elite encounter rules remain available through CombatLocationDefinition.type.
const PROGRESSION_SLOTS: Record<CombatLocationId, Slot> = {
  'stonewake-hollow': { tier: 1, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'galecrest-heights': { tier: 1, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'tideglass-caverns': { tier: 1, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'emberfall-basin': { tier: 1, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'whispering-woods': { tier: 2, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'brineveil-marsh': { tier: 2, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'cinderwild-expanse': { tier: 2, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'skybreak-cliffs': { tier: 2, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'flooded-reliquary': { tier: 3, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'ashen-watch': { tier: 3, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'rootscar-hollow': { tier: 3, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'runeblight-expanse': { tier: 3, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'stormvault-gallery': { tier: 4, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'graveglass-hollow': { tier: 4, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'starfallen-observatory': { tier: 4, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'hall-of-unbound-names': { tier: 4, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'vault-of-the-black-sigil': { tier: 5, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'pyrehold-bastion': { tier: 5, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'abyssal-reservoir': { tier: 5, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },
  'scalding-rift': { tier: 5, locationType: 'combat-zone', progressionRole: 'standard', mandatoryForTierProgression: true },

  'hunters-ground': { tier: 1, locationType: 'hunting-ground', progressionRole: 'hunting', mandatoryForTierProgression: false },
  'mistclaw-highlands': { tier: 2, locationType: 'hunting-ground', progressionRole: 'hunting', mandatoryForTierProgression: false },
  'cinderhex-barrens': { tier: 3, locationType: 'hunting-ground', progressionRole: 'hunting', mandatoryForTierProgression: false },

  'abandoned-catacombs': { tier: 1, locationType: 'dungeon', progressionRole: 'dungeon', mandatoryForTierProgression: true },
  'fractured-approach': { tier: 2, locationType: 'dungeon', progressionRole: 'dungeon', mandatoryForTierProgression: true },
  'crossroads-of-ruin': { tier: 3, locationType: 'dungeon', progressionRole: 'dungeon', mandatoryForTierProgression: true },
  'broken-meridian': { tier: 4, locationType: 'dungeon', progressionRole: 'dungeon', mandatoryForTierProgression: true },
  'black-gate': { tier: 5, locationType: 'dungeon', progressionRole: 'dungeon', mandatoryForTierProgression: true },

  'howling-den': { tier: 1, locationType: 'special', progressionRole: 'special', mandatoryForTierProgression: false },
  'cinder-sepulcher': { tier: 5, locationType: 'special', progressionRole: 'special', mandatoryForTierProgression: false },
  'temple-of-the-sunken-bell': { tier: 5, locationType: 'special', progressionRole: 'special', mandatoryForTierProgression: false },
  'stormspire-monastery': { tier: 5, locationType: 'special', progressionRole: 'special', mandatoryForTierProgression: false },
  'nullstone-archive': { tier: 5, locationType: 'special', progressionRole: 'special', mandatoryForTierProgression: false },
}

const TIER_GATE_DUNGEON: Partial<Record<CombatTier, CombatLocationId>> = {
  2: 'abandoned-catacombs', 3: 'fractured-approach', 4: 'crossroads-of-ruin', 5: 'broken-meridian',
}

export const getCombatProgressionMetadata = (location: CombatLocationDefinition): CombatProgressionMetadata => {
  const slot = PROGRESSION_SLOTS[location.id]
  if (!slot) throw new Error(`Missing Combat progression slot: ${location.id}`)
  const element = location.primaryElement ?? (location.id === 'runeblight-expanse' || location.id === 'nullstone-archive' ? 'arcane' : 'mixed')
  const unlocksTier = location.type === 'dungeon' && slot.tier < 5 ? (slot.tier + 1) as CombatTier : undefined
  return {
    ...slot,
    element,
    progressionOrder: location.progressionOrder,
    ...(slot.tier > 1 && slot.locationType === 'combat-zone' ? { requiredTier: slot.tier, requiredDungeonClear: TIER_GATE_DUNGEON[slot.tier] } : {}),
    ...(unlocksTier ? { unlocksTier } : {}),
  }
}

export const getCombatZonesForTier = (tier: CombatTier, locations: readonly CombatLocationDefinition[]): CombatLocationDefinition[] => locations.filter((location) => { const metadata = getCombatProgressionMetadata(location); return metadata.tier === tier && metadata.locationType === 'combat-zone' })
export const getHuntingGroundForTier = (tier: CombatTier, locations: readonly CombatLocationDefinition[]): CombatLocationDefinition | null => locations.find((location) => { const metadata = getCombatProgressionMetadata(location); return metadata.tier === tier && metadata.locationType === 'hunting-ground' }) ?? null
export const getDungeonForTier = (tier: CombatTier, locations: readonly CombatLocationDefinition[]): CombatLocationDefinition | null => locations.find((location) => { const metadata = getCombatProgressionMetadata(location); return metadata.tier === tier && metadata.locationType === 'dungeon' }) ?? null
export const getLocationsForTier = (tier: CombatTier, locations: readonly CombatLocationDefinition[]): CombatLocationDefinition[] => locations.filter((location) => getCombatProgressionMetadata(location).tier === tier)
