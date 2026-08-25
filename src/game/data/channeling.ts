import type { ChannelingUpgradeId, ItemId } from '../types'

export const CHANNELING_RANK_COSTS = {
  1: 9,
  2: 18,
  3: 50,
  4: 160,
  5: 250,
} as const

export const CHANNELING_UPGRADES = {
  'mana-reservoir': {
    id: 'mana-reservoir',
    name: 'Mana Reservoir',
    description: "Expand the tower's capacity to hold Mana.",
    maxRank: 5,
    valuePerRank: 25,
    resources: ['earth-fragment', 'water-fragment'],
  },
  'leyline-conduit': {
    id: 'leyline-conduit',
    name: 'Leyline Conduit',
    description: 'Strengthen the tower’s natural connection to the leyline.',
    maxRank: 5,
    valuePerRank: 1,
    resources: ['water-fragment', 'air-fragment'],
  },
} as const satisfies Record<ChannelingUpgradeId, { id: ChannelingUpgradeId; name: string; description: string; maxRank: number; valuePerRank: number; resources: readonly [ItemId, ItemId] }>

export const getChannelingRankCost = (rank: number) => rank >= 1 && rank <= 5 ? CHANNELING_RANK_COSTS[rank as 1 | 2 | 3 | 4 | 5] : null

