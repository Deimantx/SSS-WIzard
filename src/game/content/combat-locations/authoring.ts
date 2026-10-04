import type { CombatLocationDefinition, CombatLocationId } from './worldNavigationTypes'
import type { MonsterId } from '../../types'
import { EXPANSION_BOSSES_BY_LOCATION, EXPANSION_LOCATION_ROSTERS } from '../monsters/expansionMonsters'

const standardTargetMetadata = (monsterPool: readonly MonsterId[]) => Object.fromEntries(monsterPool.map((id, index) => [id, { difficulty: 'standard' as const, order: index + 1 }]))

export const authorTargetedLocation = (
  id: CombatLocationId,
  progressionOrder: number,
  name: string,
  description: string,
  type: 'combat-zone' | 'elite-zone' | 'hunting-ground',
  threatRequired: number | null,
  unlock: NonNullable<CombatLocationDefinition['unlock']>,
  zoneAffixId?: CombatLocationDefinition['zoneAffixId'],
): CombatLocationDefinition => {
  const monsterPool = EXPANSION_LOCATION_ROSTERS[id] ?? []
  const bossId = EXPANSION_BOSSES_BY_LOCATION[id] ?? null
  return { id, progressionOrder, name, description, type, monsterPool, bossId, threatRequired, encounterDelayMs: 5000, sequence: null, encounterMode: 'targeted', targetMetadata: standardTargetMetadata(monsterPool), unlock, ...(zoneAffixId ? { zoneAffixId } : {}) }
}

export const authorSequenceDungeon = (
  id: CombatLocationId,
  progressionOrder: number,
  name: string,
  description: string,
  unlock: NonNullable<CombatLocationDefinition['unlock']>,
): CombatLocationDefinition => {
  const monsterPool = EXPANSION_LOCATION_ROSTERS[id] ?? []
  const bossId = EXPANSION_BOSSES_BY_LOCATION[id] ?? null
  return { id, progressionOrder, name, description, type: 'dungeon', monsterPool, bossId, threatRequired: 0, encounterDelayMs: 5000, sequence: monsterPool, encounterMode: 'sequence', unlock }
}
