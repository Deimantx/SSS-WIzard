import type { DungeonId, MonsterId } from '../../types'

export type CombatContinentId = string
export type CombatRegionId = string
export type CombatLocationId = string

export type CombatLocationType =
  | 'combat-zone'
  | 'elite-zone'
  | 'special-zone'
  | 'dungeon'
  | 'tower'

export type CombatEncounterMode = 'random-pool' | 'targeted'
export type CombatTargetDifficulty = 'easy' | 'standard' | 'hard' | 'apex'

export interface CombatTargetMetadata {
  difficulty: CombatTargetDifficulty
  order: number
}

export type CombatNavigationUnlockCondition =
  | { type: 'always' }
  | { type: 'boss-kill'; bossId: MonsterId; count?: number }
  | { type: 'all-boss-kills'; bossIds: MonsterId[] }

export interface CombatContinentDefinition {
  id: CombatContinentId
  name: string
  description?: string
  regionIds: CombatRegionId[]
  order: number
  unlock?: CombatNavigationUnlockCondition
}

export interface CombatRegionDefinition {
  id: CombatRegionId
  continentId: CombatContinentId
  name: string
  description?: string
  locationIds: CombatLocationId[]
  order: number
  unlock?: CombatNavigationUnlockCondition
  prototype?: boolean
}

export interface CombatLocationDefinition {
  id: CombatLocationId
  regionId: CombatRegionId
  name: string
  description?: string
  type: CombatLocationType
  order: number
  dungeonId?: DungeonId
  encounterMode?: CombatEncounterMode
  targetMetadata?: Partial<Record<MonsterId, CombatTargetMetadata>>
  unlock?: CombatNavigationUnlockCondition
  prototype?: boolean
}

export const COMBAT_LOCATION_TYPE_METADATA: Record<CombatLocationType, { label: string; actionLabel: string }> = {
  'combat-zone': { label: 'COMBAT ZONE', actionLabel: 'ENTER ZONE' },
  'elite-zone': { label: 'ELITE ZONE', actionLabel: 'ENTER ELITE ZONE' },
  'special-zone': { label: 'SPECIAL ZONE', actionLabel: 'ENTER SPECIAL ZONE' },
  dungeon: { label: 'DUNGEON', actionLabel: 'ENTER DUNGEON' },
  tower: { label: 'TOWER', actionLabel: 'ENTER TOWER' },
}
