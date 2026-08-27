import { getRankOneUpgradeCost, type RankOneUpgradeCost } from '../tower/rankOneUpgradeCosts'

export const FOCUS_IMPROVEMENT = {
  id: 'focus-capacity',
  name: 'Focus Capacity',
  description: 'Expands the tower\'s ability to sustain Arcane Echoes and automated spellwork.',
  rank: 1,
  maxLevel: 10,
  focusPerLevel: 5,
} as const

export const getFocusImprovementBonus = (level: number) => Math.max(0, Math.min(FOCUS_IMPROVEMENT.maxLevel, Math.floor(level))) * FOCUS_IMPROVEMENT.focusPerLevel
export const getFocusImprovementLevelCost = (level: number): RankOneUpgradeCost | null => getRankOneUpgradeCost(level)
