import type { MonsterId } from '../../types'
import type { EliteZoneAffixId } from '../elite-affixes'
import type { ElementId } from '../elements/elements'
import type { ChronicleEventId } from '../../types'
import type { CombatLocationId } from './combatLocationIds'

export type { CombatLocationId } from './combatLocationIds'

export type CombatLocationType =
  | 'combat-zone'
  | 'elite-zone'
  | 'hunting-ground'
  | 'dungeon'

export type CombatTier = 1 | 2 | 3 | 4 | 5
export type CombatProgressionLocationType = 'combat-zone' | 'hunting-ground' | 'dungeon' | 'special'
export type CombatElement = 'fire' | 'earth' | 'air' | 'water' | 'mixed' | 'neutral' | 'arcane'

/** Tier/lane metadata for progression planning. Encounter `type` continues to
 * describe runtime mechanics such as sequence combat and Elite Zone affixes. */
export interface CombatProgressionMetadata {
  tier: CombatTier
  locationType: CombatProgressionLocationType
  element: CombatElement
  progressionOrder: number
  progressionRole: 'standard' | 'hunting' | 'dungeon' | 'special'
  mandatoryForTierProgression: boolean
  requiredTier?: CombatTier
  requiredDungeonClear?: CombatLocationId
  requiredHunterOrderRank?: string
  unlocksTier?: CombatTier
}

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

export interface CombatLocationDefinition {
  id: CombatLocationId
  name: string
  description?: string
  type: CombatLocationType
  /** Authored when a location is consistently aligned to one element. */
  primaryElement?: ElementId
  progressionOrder: number
  monsterPool: readonly MonsterId[]
  bossId: MonsterId | null
  threatRequired: number | null
  encounterDelayMs: number
  sequence: readonly MonsterId[] | null
  sequenceBossIds?: readonly MonsterId[]
  completesTutorial?: boolean
  encounterMode?: CombatEncounterMode
  zoneAffixId?: EliteZoneAffixId
  targetMetadata?: Partial<Record<MonsterId, CombatTargetMetadata>>
  firstClearUnlockPreview?: Array<{ id: string; label: string }>
  unlock?: CombatNavigationUnlockCondition
  prototype?: boolean
  progression?: CombatProgressionMetadata
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

export const COMBAT_PROGRESSION_TYPE_METADATA: Record<CombatProgressionLocationType, { label: string }> = {
  'combat-zone': { label: 'COMBAT ZONE' },
  'hunting-ground': { label: 'HUNTING GROUND' },
  dungeon: { label: 'PRIMARY DUNGEON' },
  special: { label: 'SPECIAL LOCATION' },
}
