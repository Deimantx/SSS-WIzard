import type { ItemId } from '../../types'
export interface GuildCommissionChainDefinition { id: string; name: string; description: string; minimumRank: number; stages: readonly ({ category: 'delivery'; itemId: ItemId; target: number } | { category: 'research' | 'transmutation'; target: number })[]; reputationReward: number; advancementPointsReward: number }
export const GUILD_COMMISSION_CHAINS: readonly GuildCommissionChainDefinition[] = [
  { id: 'study-ember-resonance', name: 'Study of Ember Resonance', description: 'A staged study linking elemental delivery, Transmutation, and Research.', minimumRank: 3, stages: [{ category: 'delivery', itemId: 'fire-fragment', target: 8 }, { category: 'transmutation', target: 3 }, { category: 'research', target: 2 }], reputationReward: 360, advancementPointsReward: 1 },
]
