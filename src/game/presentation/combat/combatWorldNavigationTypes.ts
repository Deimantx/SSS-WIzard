import type { CombatEncounterMode, CombatLocationId, CombatLocationType, CombatProgressionLocationType, CombatTargetDifficulty, CombatTier } from '../../content/combat-locations'
import type { ElementId } from '../../content/elements/elements'
import type { EliteZoneAffixId } from '../../content/elite-affixes'
import type { MonsterId, WorldTierId } from '../../types'
import type { CombatBossHuntPresentation } from './combatBossHuntPresentation'

export type CombatLocationState = 'locked' | 'available' | 'active' | 'boss-ready' | 'completed' | 'prototype'
export interface CombatEncounterViewModel {
  id: string
  monsterId: MonsterId | null
  role: 'normal' | 'boss'
  name: string
  known: boolean
  powerRating: number | null
}

export interface CombatTargetViewModel {
  monsterId: MonsterId
  name: string
  known: boolean
  difficulty: CombatTargetDifficulty
  order: number
  powerRating: number
  worldTier: WorldTierId
}

export interface CombatTargetingViewModel {
  mode: 'targeted'
  targets: CombatTargetViewModel[]
  activeTargetEnemyId: MonsterId | null
}

export interface CombatDungeonSequenceStepViewModel {
  order: number
  monsterId: MonsterId
  name: string
  role: 'normal' | 'boss'
  known: boolean
  powerRating: number | null
  state: 'upcoming' | 'current' | 'completed'
}

export interface CombatLocationViewModel {
  id: CombatLocationId
  name: string
  type: CombatLocationType
  progressionType: CombatProgressionLocationType
  tier: CombatTier
  laneElement: 'fire' | 'earth' | 'air' | 'water' | 'mixed' | 'neutral' | 'arcane'
  primaryElement: ElementId | null
  elementsPresent: ElementId[]
  typeLabel: string
  state: CombatLocationState
  statusLabel: string
  unlockText: string | null
  locationId: CombatLocationId | null
  description: string
  encounterMode: CombatEncounterMode
  zoneAffix: { id: EliteZoneAffixId; name: string; description: string } | null
  bossHunt: CombatBossHuntPresentation | null
  encounters: CombatEncounterViewModel[]
  boss: CombatEncounterViewModel | null
  targeting: CombatTargetingViewModel | null
  sequence: { mode: 'sequence'; steps: CombatDungeonSequenceStepViewModel[]; activeIndex: number | null; totalSteps: number } | null
  firstClearUnlockPreview: Array<{ id: string; label: string }>
  firstClearCompleted: boolean
}

export interface CombatWorldNavigationViewModel {
  allLocations: CombatLocationViewModel[]
  selectedType: CombatProgressionLocationType
  selectedLocation: CombatLocationViewModel | null
  activeLocationId: CombatLocationId | null
  activeLocation: CombatLocationViewModel | null
}
