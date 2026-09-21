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
  unlock?: CombatNavigationUnlockCondition
  prototype?: boolean
}

export const COMBAT_LOCATION_TYPE_METADATA: Record<CombatLocationType, { label: string; groupLabel: string; actionLabel: string }> = {
  'combat-zone': { label: 'COMBAT ZONE', groupLabel: 'COMBAT ZONES', actionLabel: 'ENTER ZONE' },
  'elite-zone': { label: 'ELITE ZONE', groupLabel: 'ELITE ZONES', actionLabel: 'ENTER ELITE ZONE' },
  'special-zone': { label: 'SPECIAL ZONE', groupLabel: 'SPECIAL ZONES', actionLabel: 'ENTER SPECIAL ZONE' },
  dungeon: { label: 'DUNGEON', groupLabel: 'DUNGEONS', actionLabel: 'ENTER DUNGEON' },
  tower: { label: 'TOWER', groupLabel: 'TOWERS', actionLabel: 'ENTER TOWER' },
}

export const COMBAT_LOCATION_TYPE_ORDER: readonly CombatLocationType[] = [
  'combat-zone',
  'elite-zone',
  'special-zone',
  'dungeon',
  'tower',
]

