import type { ChronicleObjectiveId, GuildRankId } from '../../types'

export interface GuildPromotionDefinition {
  reputation: number
  requiredContractClaims: number
  requiredChronicleObjectiveIds?: ChronicleObjectiveId[]
}

export interface GuildRankDefinition {
  id: GuildRankId
  name: string
  order: number
  unlocks: readonly string[]
  promotion?: GuildPromotionDefinition
  promotionGuildPointReward?: number
}

export const GUILD_RANKS: readonly GuildRankDefinition[] = [
  { id: 'outsider', name: 'Unregistered', order: 0, unlocks: ['Registry browsing'] },
  { id: 'initiate', name: 'Initiate', order: 1, unlocks: ['Guild Commissions', 'Registry Sets', 'Advancement Board'], promotion: { reputation: 0, requiredContractClaims: 0 } },
  { id: 'apprentice', name: 'Apprentice', order: 2, unlocks: ['Special Commissions', 'Apprentice-gated Board nodes'], promotion: { reputation: 175, requiredContractClaims: 0 }, promotionGuildPointReward: 2 },
  { id: 'adept', name: 'Adept', order: 3, unlocks: ['Commission Chains', 'Adept-gated Guild Projects'], promotion: { reputation: 600, requiredContractClaims: 0 }, promotionGuildPointReward: 2 },
  { id: 'magister', name: 'Arcanist', order: 4, unlocks: ['Prestigious Commissions', 'Advanced Board privileges'], promotion: { reputation: 1200, requiredContractClaims: 0 }, promotionGuildPointReward: 2 },
  { id: 'circle-master', name: 'Grand Magister', order: 5, unlocks: ['All current Guild services and Board nodes'], promotion: { reputation: 2000, requiredContractClaims: 0 }, promotionGuildPointReward: 2 },
]

export const GUILD_RANK_BY_ID = Object.fromEntries(GUILD_RANKS.map((rank) => [rank.id, rank])) as Record<GuildRankId, GuildRankDefinition>
