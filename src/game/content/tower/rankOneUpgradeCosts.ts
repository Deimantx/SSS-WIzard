export type RankOneUpgradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface RankOneUpgradeCost {
  primary: number
  lifeEssence: number
}

/** Shared Rank I curve for permanent Tower upgrades. */
export const RANK_ONE_TOWER_UPGRADE_COSTS: Record<RankOneUpgradeLevel, RankOneUpgradeCost> = {
  1: { primary: 5, lifeEssence: 10 },
  2: { primary: 10, lifeEssence: 20 },
  3: { primary: 15, lifeEssence: 30 },
  4: { primary: 25, lifeEssence: 50 },
  5: { primary: 40, lifeEssence: 80 },
  6: { primary: 60, lifeEssence: 120 },
  7: { primary: 90, lifeEssence: 180 },
  8: { primary: 130, lifeEssence: 260 },
  9: { primary: 180, lifeEssence: 360 },
  10: { primary: 250, lifeEssence: 500 },
}

export const getRankOneUpgradeCost = (level: number): RankOneUpgradeCost | null => (
  level >= 1 && level <= 10 ? RANK_ONE_TOWER_UPGRADE_COSTS[level as RankOneUpgradeLevel] : null
)
