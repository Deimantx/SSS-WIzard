import { COMBAT_LOCATIONS } from '../combat-locations/worldNavigation'
import type { CombatLocationId } from '../../types'
import type { HunterStandingDefinition } from './hunterRanks'

export interface HunterGroundDefinition {
  id: CombatLocationId
  name: string
  minimumStandingId: HunterStandingDefinition['id']
  boardWeight: number
  enabled: boolean
}

/** Stable default for legacy Contracts that predate explicit Ground ownership. */
export const DEFAULT_HUNTER_GROUND_ID: CombatLocationId = 'hunters-ground'

export const HUNTER_GROUNDS: readonly HunterGroundDefinition[] = [
  { id: 'hunters-ground', name: COMBAT_LOCATIONS['hunters-ground'].name, minimumStandingId: 'tracker-1', boardWeight: 1, enabled: true },
  { id: 'mistclaw-highlands', name: COMBAT_LOCATIONS['mistclaw-highlands'].name, minimumStandingId: 'warden-1', boardWeight: 1, enabled: true },
  { id: 'cinderhex-barrens', name: COMBAT_LOCATIONS['cinderhex-barrens'].name, minimumStandingId: 'warden-1', boardWeight: 1, enabled: true },
]

export const getHunterGround = (id: CombatLocationId | string | null | undefined) => HUNTER_GROUNDS.find((ground) => ground.id === id) ?? null
