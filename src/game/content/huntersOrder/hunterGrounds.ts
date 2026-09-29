import { DUNGEONS } from '../dungeons/dungeons'
import type { DungeonId } from '../../types'
import type { HunterStandingDefinition } from './hunterRanks'

export interface HunterGroundDefinition {
  id: DungeonId
  name: string
  minimumStandingId: HunterStandingDefinition['id']
  boardWeight: number
  enabled: boolean
}

/** Stable default for legacy Contracts that predate explicit Ground ownership. */
export const DEFAULT_HUNTER_GROUND_ID: DungeonId = 'hunters-ground'

export const HUNTER_GROUNDS: readonly HunterGroundDefinition[] = [
  { id: 'hunters-ground', name: DUNGEONS['hunters-ground'].name, minimumStandingId: 'tracker-1', boardWeight: 1, enabled: true },
]

export const getHunterGround = (id: DungeonId | string | null | undefined) => HUNTER_GROUNDS.find((ground) => ground.id === id) ?? null
