import type { DungeonId } from '../../types'

export interface ArcaneCoreRewardDefinition {
  corePoints: number
  normalEssence: number
  bossEssence: number
}

/** Centralized prototype economy. Boss Core Points are repeatable on every kill. */
export const ARCANE_CORE_REWARDS: Record<DungeonId, ArcaneCoreRewardDefinition> = {
  'whispering-woods': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'howling-den': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'abandoned-catacombs': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'fractured-approach': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'flooded-reliquary': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'ashen-watch': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'rootscar-hollow': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'crossroads-of-ruin': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'graveglass-hollow': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'stormvault-gallery': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'starfallen-observatory': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'broken-meridian': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'hall-of-unbound-names': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'vault-of-the-black-sigil': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
  'black-gate': { corePoints: 1, normalEssence: 1, bossEssence: 10 },
}

export const getArcaneCoreReward = (dungeonId: DungeonId | null) => dungeonId ? ARCANE_CORE_REWARDS[dungeonId] : null
