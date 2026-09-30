import type { ChronicleObjectiveId, GuildRankId } from '../../types'

export interface GuildPromotionDefinition {
  reputation: number
  requiredContractClaims: number
  requiredCommissions?: number
  requiredRegistrySets?: number
  requiredStudies?: number
  requiredProjects?: number
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
  { id: 'apprentice', name: 'Apprentice', order: 2, unlocks: ['Special Commissions', 'Apprentice Standing'], promotion: { reputation: 6000, requiredContractClaims: 0, requiredCommissions: 5 }, promotionGuildPointReward: 8 },
  { id: 'adept', name: 'Adept', order: 3, unlocks: ['Adept Studies', 'Adept Standing'], promotion: { reputation: 20800, requiredContractClaims: 0, requiredRegistrySets: 1, requiredStudies: 1 }, promotionGuildPointReward: 8 },
  { id: 'magister', name: 'Arcanist', order: 4, unlocks: ['Prestigious Commissions', 'Arcanist Standing'], promotion: { reputation: 48000, requiredContractClaims: 0, requiredProjects: 2, requiredStudies: 3 }, promotionGuildPointReward: 8 },
  { id: 'circle-master', name: 'Grand Magister', order: 5, unlocks: ['Grand Magister Standing', 'Master Projects'], promotion: { reputation: 100000, requiredContractClaims: 0, requiredProjects: 5, requiredStudies: 6 }, promotionGuildPointReward: 8 },
]

export const GUILD_RANK_BY_ID = Object.fromEntries(GUILD_RANKS.map((rank) => [rank.id, rank])) as Record<GuildRankId, GuildRankDefinition>
