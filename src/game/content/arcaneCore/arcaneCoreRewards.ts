import type { DungeonId } from '../../types'
import { ARCANE_CORE_DUNGEON_XP_REWARDS } from './arcaneCoreBalance'

export interface ArcaneCoreRewardDefinition {
  normalKillXp: number
  bossKillXp: number
}

export const ARCANE_CORE_REWARDS: Record<DungeonId, ArcaneCoreRewardDefinition> = ARCANE_CORE_DUNGEON_XP_REWARDS
export const getArcaneCoreReward = (dungeonId: DungeonId | null) => dungeonId ? ARCANE_CORE_REWARDS[dungeonId] : null
