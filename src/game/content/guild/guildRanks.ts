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
  promotion?: GuildPromotionDefinition
  promotionGuildPointReward?: number
}

export const GUILD_RANKS: readonly GuildRankDefinition[] = [
  { id: 'outsider', name: 'Outsider', order: 0 },
  { id: 'initiate', name: 'Initiate', order: 1, promotion: { reputation: 0, requiredContractClaims: 0 } },
  { id: 'apprentice', name: 'Apprentice', order: 2, promotion: { reputation: 175, requiredContractClaims: 3 }, promotionGuildPointReward: 1 },
  { id: 'adept', name: 'Adept', order: 3, promotion: { reputation: 600, requiredContractClaims: 6, requiredChronicleObjectiveIds: ['m5-fallen-archmage'] } },
  { id: 'magister', name: 'Magister', order: 4, promotion: { reputation: 1200, requiredContractClaims: 8, requiredChronicleObjectiveIds: ['sf-m5-meridian-splitter'] } },
  { id: 'circle-master', name: 'Circle Master', order: 5, promotion: { reputation: 2000, requiredContractClaims: 10, requiredChronicleObjectiveIds: ['sf-m6-world-tier-two'] } },
]

export const GUILD_RANK_BY_ID = Object.fromEntries(GUILD_RANKS.map((rank) => [rank.id, rank])) as Record<GuildRankId, GuildRankDefinition>
