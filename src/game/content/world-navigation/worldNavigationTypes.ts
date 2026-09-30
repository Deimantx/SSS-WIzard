import type { DungeonId, MonsterId } from '../../types'
import type { EliteZoneAffixId } from '../elite-affixes'
import type { ElementId } from '../elements/elements'
import type { ChronicleEventId } from '../../types'

export type CombatContinentId = string
export type CombatRegionId = string
export type CombatLocationId = string

export type CombatLocationType =
  | 'combat-zone'
  | 'elite-zone'
  | 'hunting-ground'
  | 'special-zone'
  | 'dungeon'
  | 'tower'

export type CombatZoneType = Extract<CombatLocationType, 'combat-zone' | 'elite-zone' | 'hunting-ground' | 'dungeon'>

export type CombatEncounterMode = 'random-pool' | 'targeted' | 'sequence'
export type CombatTargetDifficulty = 'easy' | 'standard' | 'hard' | 'apex'

export interface CombatTargetMetadata {
  difficulty: CombatTargetDifficulty
  order: number
}

export type CombatNavigationUnlockCondition =
  | { type: 'always' }
  | { type: 'boss-kill'; bossId: MonsterId; count?: number }
  | { type: 'all-boss-kills'; bossIds: MonsterId[] }
  | { type: 'chronicle-event'; eventId: ChronicleEventId }
  | { type: 'starter-advantage'; targetElement: ElementId }
  | { type: 'any'; conditions: CombatNavigationUnlockCondition[] }
  | { type: 'all'; conditions: CombatNavigationUnlockCondition[] }

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
  /** Authored when a location is consistently aligned to one element. */
  primaryElement?: ElementId
  /** Data-derived affinities represented by this location's canonical roster. */
  elementsPresent?: ElementId[]
  order: number
  dungeonId?: DungeonId
  encounterMode?: CombatEncounterMode
  zoneAffixId?: EliteZoneAffixId
  targetMetadata?: Partial<Record<MonsterId, CombatTargetMetadata>>
  firstClearUnlockPreview?: Array<{ id: string; label: string }>
  unlock?: CombatNavigationUnlockCondition
  prototype?: boolean
}

export const COMBAT_LOCATION_TYPE_METADATA: Record<CombatLocationType, { label: string; actionLabel: string }> = {
  'combat-zone': { label: 'COMBAT ZONE', actionLabel: 'ENTER ZONE' },
  'elite-zone': { label: 'ELITE ZONE', actionLabel: 'ENTER ELITE ZONE' },
  'hunting-ground': { label: 'HUNTING GROUND', actionLabel: 'ENTER HUNTING GROUND' },
  'special-zone': { label: 'SPECIAL ZONE', actionLabel: 'ENTER SPECIAL ZONE' },
  dungeon: { label: 'DUNGEON', actionLabel: 'ENTER DUNGEON' },
  tower: { label: 'TOWER', actionLabel: 'ENTER TOWER' },
}
