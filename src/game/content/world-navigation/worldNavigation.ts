import { ACT1_DUNGEONS } from '../dungeons/act1'
import { DUNGEONS } from '../dungeons/dungeons'
import type { DungeonId } from '../../types'
import type { CombatContinentDefinition, CombatContinentId, CombatEncounterMode, CombatLocationDefinition, CombatLocationId, CombatRegionDefinition, CombatRegionId } from './worldNavigationTypes'

const firstFrontierLocationIds: readonly CombatLocationId[] = ['whispering-woods', 'howling-den', 'abandoned-catacombs']
const shatteredFrontierLocationIds: readonly CombatLocationId[] = ACT1_DUNGEONS.map((dungeon) => dungeon.id)

export const COMBAT_CONTINENTS: Record<CombatContinentId, CombatContinentDefinition> = {
  'continent-1': {
    id: 'continent-1',
    name: 'Continent I',
    description: 'The first mapped frontier beyond the tower.',
    regionIds: ['first-frontier', 'shattered-frontier'],
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
  'shattered-frontier': {
    id: 'shattered-frontier',
    continentId: 'continent-1',
    name: 'The Shattered Frontier',
    description: 'A broken meridian of increasingly dangerous routes.',
    locationIds: [...shatteredFrontierLocationIds],
    order: 2,
    unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade', count: 1 },
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
  'howling-den': dungeonLocation('first-frontier', 'howling-den', 'dungeon', 2),
  'abandoned-catacombs': dungeonLocation('first-frontier', 'abandoned-catacombs', 'dungeon', 3),
  ...Object.fromEntries(shatteredFrontierLocationIds.map((dungeonId, index) => [dungeonId, dungeonLocation('shattered-frontier', dungeonId as DungeonId, 'dungeon', index + 1)])),
}

export const getCombatLocation = (locationId: CombatLocationId | null | undefined) => locationId ? COMBAT_LOCATIONS[locationId] ?? null : null

export const getCombatLocationByDungeonId = (dungeonId: DungeonId | null | undefined) => {
  if (!dungeonId) return null
  return Object.values(COMBAT_LOCATIONS).find((location) => location.dungeonId === dungeonId) ?? null
}

export const getCombatEncounterMode = (location: CombatLocationDefinition | null | undefined): CombatEncounterMode => location?.encounterMode ?? 'random-pool'

export const isCombatTargetForLocation = (location: CombatLocationDefinition | null | undefined, dungeonId: DungeonId | null | undefined, targetEnemyId: string | null | undefined) => {
  if (!location || !dungeonId || getCombatEncounterMode(location) !== 'targeted' || !targetEnemyId || !location.targetMetadata?.[targetEnemyId as keyof typeof location.targetMetadata]) return false
  const dungeon = DUNGEONS[dungeonId]
  return Boolean(dungeon && dungeon.monsterPool.includes(targetEnemyId as typeof dungeon.monsterPool[number]) && dungeon.boss !== targetEnemyId)
}
