import type { DungeonId } from '../../types'

export interface ArcaneCoreRewardDefinition {
  normalKillPoints: number
  bossKillPoints: number
}

export const ARCANE_CORE_REWARDS: Record<DungeonId, ArcaneCoreRewardDefinition> = {
  'whispering-woods': { normalKillPoints: 1, bossKillPoints: 8 },
  'howling-den': { normalKillPoints: 1, bossKillPoints: 10 },
  'abandoned-catacombs': { normalKillPoints: 2, bossKillPoints: 13 },
  'fractured-approach': { normalKillPoints: 2, bossKillPoints: 16 },
  'flooded-reliquary': { normalKillPoints: 2, bossKillPoints: 19 },
  'ashen-watch': { normalKillPoints: 3, bossKillPoints: 22 },
  'rootscar-hollow': { normalKillPoints: 3, bossKillPoints: 25 },
  'crossroads-of-ruin': { normalKillPoints: 4, bossKillPoints: 28 },
  'graveglass-hollow': { normalKillPoints: 4, bossKillPoints: 31 },
  'stormvault-gallery': { normalKillPoints: 4, bossKillPoints: 34 },
  'starfallen-observatory': { normalKillPoints: 5, bossKillPoints: 38 },
  'broken-meridian': { normalKillPoints: 5, bossKillPoints: 42 },
  'hall-of-unbound-names': { normalKillPoints: 6, bossKillPoints: 46 },
  'vault-of-the-black-sigil': { normalKillPoints: 6, bossKillPoints: 50 },
  'black-gate': { normalKillPoints: 7, bossKillPoints: 60 },
}
export const getArcaneCoreReward = (dungeonId: DungeonId | null) => dungeonId ? ARCANE_CORE_REWARDS[dungeonId] : null
