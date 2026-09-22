import type { CombatContinentId, CombatEncounterMode, CombatLocationId, CombatLocationType, CombatRegionId, CombatTargetDifficulty } from '../../content/world-navigation'
import type { EliteZoneAffixId } from '../../content/elite-affixes'
import type { DungeonId, MonsterId, WorldTierId } from '../../types'
import type { CombatBossHuntPresentation } from './combatBossHuntPresentation'

export type CombatLocationState = 'locked' | 'available' | 'active' | 'boss-ready' | 'completed' | 'prototype'
export type CombatNavigationNodeState = 'locked' | 'available'

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
  typeLabel: string
  state: CombatLocationState
  statusLabel: string
  unlockText: string | null
  dungeonId: DungeonId | null
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

export interface CombatContinentSummaryViewModel {
  id: CombatContinentId
  name: string
  description: string
  state: CombatNavigationNodeState
  unlockText: string | null
}

export interface CombatRegionSummaryViewModel {
  id: CombatRegionId
  name: string
  description: string
  state: CombatNavigationNodeState
  unlockText: string | null
  locationCount: number
}

export interface CombatRegionViewModel extends CombatRegionSummaryViewModel {
  locations: CombatLocationViewModel[]
}

export interface CombatWorldNavigationViewModel {
  continents: CombatContinentSummaryViewModel[]
  regions: CombatRegionSummaryViewModel[]
  selectedContinent: CombatContinentSummaryViewModel
  selectedRegion: CombatRegionViewModel
  selectedLocation: CombatLocationViewModel | null
  activeLocationId: CombatLocationId | null
  activeLocation: CombatLocationViewModel | null
}
