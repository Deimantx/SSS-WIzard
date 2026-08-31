import type { CombatEvent } from '../../systems/combat/combatTypes'
import type { DungeonId, GameState, ItemId, MonsterId } from '../../types'

export type DungeonStatisticsMode = 'runs' | 'loot' | 'efficiency'

export const DUNGEON_STATISTICS_MODE_ORDER: readonly DungeonStatisticsMode[] = ['runs', 'loot', 'efficiency']

export interface DungeonStatisticsSession {
  dungeonId: DungeonId
  startedAtMs: number
  elapsedMs: number
  engagedMs: number
  completedRuns: number
  currentRunElapsedMs: number
  completedRunDurationTotalMs: number
  bestRunMs: number | null
  normalEncounterCount: number
  normalEncounterDurationTotalMs: number
  fastestEncounterMs: number | null
  bossEncounterCount: number
  bossDurationTotalMs: number
  fastestBossMs: number | null
  totalLootQuantity: number
  lootByItemId: Partial<Record<ItemId, number>>
}

export interface DungeonStatisticsObserver {
  beginSession: (dungeonId: DungeonId) => void
  endSession: (reason: 'leave' | 'death' | 'dungeon-change') => void
  advance: (deltaMs: number, state: GameState) => void
  beginRun: () => void
  completeRun: (durationMs: number) => void
  beginEncounter: (monsterId: MonsterId, boss: boolean) => void
  completeEncounter: (monsterId: MonsterId, durationMs: number, boss: boolean) => void
  recordLoot: (itemId: ItemId, quantity: number) => void
  consume: (event: CombatEvent) => void
  reset: () => void
  clear: () => void
}

export interface DungeonStatisticsState {
  session: DungeonStatisticsSession | null
  active: boolean
}
