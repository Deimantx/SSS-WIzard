export type RankOneUpgradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface RankOneUpgradeCost {
  primary: number
  lifeEssence: number
}

/** Shared Rank I curve for permanent Tower upgrades. */
export const RANK_ONE_TOWER_UPGRADE_COSTS: Record<RankOneUpgradeLevel, RankOneUpgradeCost> = {
  1: { primary: 20, lifeEssence: 50 },
  2: { primary: 40, lifeEssence: 100 },
  3: { primary: 60, lifeEssence: 150 },
  4: { primary: 100, lifeEssence: 250 },
  5: { primary: 160, lifeEssence: 400 },
  6: { primary: 240, lifeEssence: 600 },
  7: { primary: 360, lifeEssence: 900 },
  8: { primary: 520, lifeEssence: 1300 },
  9: { primary: 720, lifeEssence: 1800 },
  10: { primary: 1000, lifeEssence: 2500 },
}

export const getRankOneUpgradeCost = (level: number): RankOneUpgradeCost | null => (
  level >= 1 && level <= 10 ? RANK_ONE_TOWER_UPGRADE_COSTS[level as RankOneUpgradeLevel] : null
)
