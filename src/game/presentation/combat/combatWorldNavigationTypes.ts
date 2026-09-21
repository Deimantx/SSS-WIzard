import type { CombatContinentId, CombatLocationId, CombatLocationType, CombatRegionId } from '../../content/world-navigation'
import type { DungeonId, MonsterId } from '../../types'

export type CombatLocationState = 'locked' | 'available' | 'active' | 'boss-ready' | 'completed' | 'prototype'
export type CombatNavigationNodeState = 'locked' | 'available'

export interface CombatEncounterViewModel {
  id: string
  monsterId: MonsterId | null
  role: 'normal' | 'boss'
  name: string
  known: boolean
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
  encounters: CombatEncounterViewModel[]
  boss: CombatEncounterViewModel | null
  threatRequired: number | null
  threatCleared: number
  normalKills: number
  bossClears: number
}

export interface CombatLocationGroupViewModel {
  type: CombatLocationType
  label: string
  locations: CombatLocationViewModel[]
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
  groups: CombatLocationGroupViewModel[]
}

export interface CombatWorldNavigationViewModel {
  continents: CombatContinentSummaryViewModel[]
  regions: CombatRegionSummaryViewModel[]
  selectedContinent: CombatContinentSummaryViewModel
  selectedRegion: CombatRegionViewModel
  selectedLocation: CombatLocationViewModel | null
  activeLocationId: CombatLocationId | null
  activeLocation: CombatLocationViewModel | null
  breadcrumb: string
}

