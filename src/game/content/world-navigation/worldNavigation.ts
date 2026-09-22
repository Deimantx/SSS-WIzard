import { DUNGEONS } from '../dungeons/dungeons'
import type { DungeonId } from '../../types'
import type { CombatContinentDefinition, CombatContinentId, CombatEncounterMode, CombatLocationDefinition, CombatLocationId, CombatRegionDefinition, CombatRegionId } from './worldNavigationTypes'

const firstFrontierLocationIds: readonly CombatLocationId[] = ['whispering-woods', 'howling-den', 'abandoned-catacombs']
const elementalScarLocationIds: readonly CombatLocationId[] = ['fractured-approach', 'flooded-reliquary', 'ashen-watch', 'rootscar-hollow', 'crossroads-of-ruin']
const shatteredMeridianLocationIds: readonly CombatLocationId[] = ['graveglass-hollow', 'stormvault-gallery', 'starfallen-observatory', 'broken-meridian']
const blackSigilReachLocationIds: readonly CombatLocationId[] = ['hall-of-unbound-names', 'vault-of-the-black-sigil', 'black-gate']

export const COMBAT_CONTINENTS: Record<CombatContinentId, CombatContinentDefinition> = {
  'continent-1': {
    id: 'continent-1',
    name: 'Continent I',
    description: 'The first mapped frontier beyond the tower.',
    regionIds: ['first-frontier', 'elemental-scar', 'shattered-meridian', 'black-sigil-reach'],
    order: 1,
    unlock: { type: 'always' },
  },
}

export const COMBAT_REGIONS: Record<CombatRegionId, CombatRegionDefinition> = {
  'first-frontier': {
    id: 'first-frontier',
    continentId: 'continent-1',
    name: 'First Frontier',
    description: 'The first stretch of wild territory traced from the tower.',
    locationIds: [...firstFrontierLocationIds],
    order: 1,
    unlock: { type: 'always' },
  },
  'elemental-scar': {
    id: 'elemental-scar',
    continentId: 'continent-1',
    name: 'Elemental Scar',
    description: 'A wounded elemental corridor where the old frontier gives way to unstable crossings.',
    locationIds: [...elementalScarLocationIds],
    order: 2,
    unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade', count: 1 },
  },
  'shattered-meridian': {
    id: 'shattered-meridian',
    continentId: 'continent-1',
    name: 'Shattered Meridian',
    description: 'A fractured leyline where roads, ruins, and starlight pull against one another.',
    locationIds: [...shatteredMeridianLocationIds],
    order: 3,
    unlock: { type: 'boss-kill', bossId: 'crossroads-keeper', count: 1 },
  },
  'black-sigil-reach': {
    id: 'black-sigil-reach',
    continentId: 'continent-1',
    name: 'Black Sigil Reach',
    description: 'The sealed approach to the dark gate, marked by names and wards that should not endure.',
    locationIds: [...blackSigilReachLocationIds],
    order: 4,
    unlock: { type: 'boss-kill', bossId: 'meridian-splitter', count: 1 },
  },
}

const dungeonLocation = (regionId: CombatRegionId, dungeonId: DungeonId, type: CombatLocationDefinition['type'], order: number): CombatLocationDefinition => ({
  id: dungeonId,
  regionId,
  name: DUNGEONS[dungeonId].name,
  type,
  order,
  dungeonId,
  encounterMode: 'random-pool',
})

export const COMBAT_LOCATIONS: Record<CombatLocationId, CombatLocationDefinition> = {
  'whispering-woods': {
    ...dungeonLocation('first-frontier', 'whispering-woods', 'combat-zone', 1),
    encounterMode: 'targeted',
    targetMetadata: {
      'forest-wisp': { difficulty: 'easy', order: 1 },
      thornling: { difficulty: 'easy', order: 2 },
      'dewbound-sprite': { difficulty: 'standard', order: 3 },
      'cinder-moth': { difficulty: 'standard', order: 4 },
      'stone-root': { difficulty: 'standard', order: 5 },
      'grove-sentinel': { difficulty: 'hard', order: 6 },
      'tempest-stag': { difficulty: 'apex', order: 7 },
    },
  },
  'howling-den': {
    ...dungeonLocation('first-frontier', 'howling-den', 'elite-zone', 2),
    encounterMode: 'targeted',
    zoneAffixId: 'frenzied',
    targetMetadata: {
      'cavefang-wolf': { difficulty: 'standard', order: 1 },
      'razorclaw-lynx': { difficulty: 'standard', order: 2 },
      'corrupted-dire-wolf': { difficulty: 'hard', order: 3 },
      'bonehide-boar': { difficulty: 'hard', order: 4 },
      'moonblind-jackal': { difficulty: 'hard', order: 5 },
      'den-stalker': { difficulty: 'apex', order: 6 },
    },
  },
  'abandoned-catacombs': {
    ...dungeonLocation('first-frontier', 'abandoned-catacombs', 'dungeon', 3),
    encounterMode: 'sequence',
    firstClearUnlockPreview: [
      { id: 'black-portal-shard', label: 'Black Portal Shard' },
      { id: 'dark-portal', label: 'Dark Portal' },
      { id: 'world-tier-2', label: 'World Tier 2' },
      { id: 'elemental-scar', label: 'Elemental Scar' },
      { id: 'magic-school-cap', label: 'Magic School Cap Increase' },
    ],
  },
  'fractured-approach': {
    ...dungeonLocation('elemental-scar', 'fractured-approach', 'dungeon', 1),
    encounterMode: 'sequence',
    firstClearUnlockPreview: [
      { id: 'summoning', label: 'Summoning' },
      { id: 'flooded-reliquary', label: 'Flooded Reliquary' },
      { id: 'ashen-watch', label: 'Ashen Watch' },
      { id: 'rootscar-hollow', label: 'Rootscar Hollow' },
    ],
  },
  'flooded-reliquary': {
    ...dungeonLocation('elemental-scar', 'flooded-reliquary', 'combat-zone', 2),
    encounterMode: 'targeted',
    targetMetadata: {
      'drowned-acolyte': { difficulty: 'easy', order: 1 },
      'reliquary-slime': { difficulty: 'easy', order: 2 },
      'mist-wraith': { difficulty: 'standard', order: 3 },
      'rune-leech': { difficulty: 'standard', order: 4 },
      'tidefang-serpent': { difficulty: 'standard', order: 5 },
      'brinebound-sentinel': { difficulty: 'hard', order: 6 },
      'abyssal-archivist': { difficulty: 'apex', order: 7 },
    },
  },
  'ashen-watch': {
    ...dungeonLocation('elemental-scar', 'ashen-watch', 'combat-zone', 3),
    encounterMode: 'targeted',
    targetMetadata: {
      'cinder-hound': { difficulty: 'easy', order: 1 },
      'ash-cultist': { difficulty: 'easy', order: 2 },
      'fire-elemental': { difficulty: 'standard', order: 3 },
      'lava-eel': { difficulty: 'standard', order: 4 },
      'emberwing-harrier': { difficulty: 'standard', order: 5 },
      'charred-warden': { difficulty: 'hard', order: 6 },
      'pyre-colossus': { difficulty: 'apex', order: 7 },
    },
  },
  'rootscar-hollow': {
    ...dungeonLocation('elemental-scar', 'rootscar-hollow', 'combat-zone', 4),
    encounterMode: 'targeted',
    targetMetadata: {
      'thorn-maw': { difficulty: 'easy', order: 1 },
      'rootbound-stalker': { difficulty: 'easy', order: 2 },
      'briar-sprite': { difficulty: 'standard', order: 3 },
      'moss-carapace': { difficulty: 'standard', order: 4 },
      'sporeback-brute': { difficulty: 'standard', order: 5 },
      'vinebound-reaver': { difficulty: 'hard', order: 6 },
      'scarwood-behemoth': { difficulty: 'apex', order: 7 },
    },
  },
  'crossroads-of-ruin': {
    ...dungeonLocation('elemental-scar', 'crossroads-of-ruin', 'dungeon', 5),
    encounterMode: 'sequence',
    firstClearUnlockPreview: [
      { id: 'shattered-meridian', label: 'Shattered Meridian' },
    ],
  },
  'graveglass-hollow': dungeonLocation('shattered-meridian', 'graveglass-hollow', 'elite-zone', 1),
  'stormvault-gallery': dungeonLocation('shattered-meridian', 'stormvault-gallery', 'combat-zone', 2),
  'starfallen-observatory': dungeonLocation('shattered-meridian', 'starfallen-observatory', 'elite-zone', 3),
  'broken-meridian': dungeonLocation('shattered-meridian', 'broken-meridian', 'dungeon', 4),
  'hall-of-unbound-names': dungeonLocation('black-sigil-reach', 'hall-of-unbound-names', 'elite-zone', 1),
  'vault-of-the-black-sigil': dungeonLocation('black-sigil-reach', 'vault-of-the-black-sigil', 'elite-zone', 2),
  'black-gate': dungeonLocation('black-sigil-reach', 'black-gate', 'dungeon', 3),
}

export const getCombatLocation = (locationId: CombatLocationId | null | undefined) => locationId ? COMBAT_LOCATIONS[locationId] ?? null : null

export const getCombatLocationByDungeonId = (dungeonId: DungeonId | null | undefined) => {
  if (!dungeonId) return null
  return Object.values(COMBAT_LOCATIONS).find((location) => location.dungeonId === dungeonId) ?? null
}

export const getCombatEncounterMode = (location: CombatLocationDefinition | null | undefined): CombatEncounterMode => location?.encounterMode ?? 'random-pool'

export const usesPowerBasedThreat = (location: CombatLocationDefinition | null | undefined) => Boolean(
  location?.encounterMode === 'targeted' && (location.type === 'combat-zone' || location.type === 'elite-zone'),
)

export const isCombatTargetForLocation = (location: CombatLocationDefinition | null | undefined, dungeonId: DungeonId | null | undefined, targetEnemyId: string | null | undefined) => {
  if (!location || !dungeonId || getCombatEncounterMode(location) !== 'targeted' || !targetEnemyId || !location.targetMetadata?.[targetEnemyId as keyof typeof location.targetMetadata]) return false
  const dungeon = DUNGEONS[dungeonId]
  return Boolean(dungeon && dungeon.monsterPool.includes(targetEnemyId as typeof dungeon.monsterPool[number]) && dungeon.boss !== targetEnemyId)
}
