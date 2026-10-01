import { DUNGEONS } from '../combat-locations/dungeons/dungeons'
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
  { id: 'hunters-ground', name: DUNGEONS['hunters-ground'].name, minimumStandingId: 'tracker-1', boardWeight: 1, enabled: true },
]

export const getHunterGround = (id: CombatLocationId | string | null | undefined) => HUNTER_GROUNDS.find((ground) => ground.id === id) ?? null
