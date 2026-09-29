import type { HunterRankId } from '../../types'

const curves: Record<HunterRankId, readonly number[]> = {
  tracker: [2, 4, 7, 11, 16], scout: [4, 7, 11, 16, 22], stalker: [6, 10, 15, 21, 28],
  warden: [9, 14, 20, 27, 35], veteran: [12, 18, 26, 35, 45], 'master-hunter': [16, 24, 34, 45, 58],
}

export const getHunterUpgradeCosts = (rank: HunterRankId, maxRank: number): readonly number[] => curves[rank].slice(0, maxRank)
export const HUNTER_UPGRADE_COST_CURVES = curves
