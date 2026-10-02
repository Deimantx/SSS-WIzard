import type { MonsterId } from '../../types'
import type { EliteZoneAffixId } from '../elite-affixes'
import type { ElementId } from '../elements/elements'
import type { ChronicleEventId } from '../../types'
import type { CombatLocationId, CombatRegionId } from './combatLocationIds'

export type { CombatLocationId, CombatRegionId } from './combatLocationIds'

export type CombatLocationType =
  | 'combat-zone'
  | 'elite-zone'
  | 'hunting-ground'
  | 'dungeon'

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

export interface CombatRegionDefinition {
  id: CombatRegionId
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
  order: number
  monsterPool: readonly MonsterId[]
  bossId: MonsterId | null
  threatRequired: number | null
  encounterDelayMs: number
  sequence: readonly MonsterId[] | null
  completesTutorial?: boolean
  encounterMode?: CombatEncounterMode
  zoneAffixId?: EliteZoneAffixId
  targetMetadata?: Partial<Record<MonsterId, CombatTargetMetadata>>
  firstClearUnlockPreview?: Array<{ id: string; label: string }>
  unlock?: CombatNavigationUnlockCondition
  prototype?: boolean
}

/** Compatibility read model for consumers that still need encounter-table aliases. */
export interface CombatLocationRuntimeView extends CombatLocationDefinition {
  boss: MonsterId | null
  threatRequired: number | null
  encounterSequence?: readonly MonsterId[]
  ui?: { description?: string }
  elementsPresent: ElementId[]
}
export type BossCombatLocationRuntimeView = CombatLocationRuntimeView & { boss: MonsterId; threatRequired: number }

export const COMBAT_LOCATION_TYPE_METADATA: Record<CombatLocationType, { label: string; actionLabel: string }> = {
  'combat-zone': { label: 'COMBAT ZONE', actionLabel: 'ENTER ZONE' },
  'elite-zone': { label: 'ELITE ZONE', actionLabel: 'ENTER ELITE ZONE' },
  'hunting-ground': { label: 'HUNTING GROUND', actionLabel: 'ENTER HUNTING GROUND' },
  dungeon: { label: 'DUNGEON', actionLabel: 'ENTER DUNGEON' },
}
