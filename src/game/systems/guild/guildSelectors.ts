import { GUILD_REQUESTS, LEGACY_GUILD_REQUESTS, type GuildRequestId } from '../../content/guild/guildRequests'
import { GUILD_RANKS, GUILD_RANK_BY_ID, type GuildRankDefinition } from '../../content/guild/guildRanks'
import { GUILD_SKILL_NODES } from '../../content/guild/guildSkills'
import type { GameState, GuildRankId, GuildSkillNodeId } from '../../types'

const rankOrder: GuildRankId[] = ['outsider', 'initiate', 'apprentice', 'adept', 'magister', 'circle-master']
const rankAtLeast = (current: GuildRankId, required: GuildRankId) => rankOrder.indexOf(current) >= rankOrder.indexOf(required)
const nodePurchased = (state: Pick<GameState, 'progress'>, nodeId: GuildSkillNodeId) => (state.progress.guildSkillNodeRanks[nodeId] ?? 0) > 0

export interface GuildProgressionBonuses {
  combatArcanePointMultiplier: number
  combatResonanceMultiplier: number
  lifeEssenceMultiplier: number
  artifactEssenceMultiplier: number
  bossEssenceMultiplier: number
  crystalCacheChanceMultiplier: number
  arcaneFluxMultiplier: number
  transmutationSpeedMultiplier: number
  bonusAcolytes: number
}

export const getGuildProgressionBonuses = (state: Pick<GameState, 'progress'>): GuildProgressionBonuses => ({
  combatArcanePointMultiplier: nodePurchased(state, 'hunter-arcane-quarry') ? 1.05 : 1,
  combatResonanceMultiplier: nodePurchased(state, 'hunter-resonant-pursuit') ? 1.05 : 1,
  lifeEssenceMultiplier: nodePurchased(state, 'quartermaster-careful-harvest') ? 1.05 : 1,
  artifactEssenceMultiplier: nodePurchased(state, 'quartermaster-relic-appraisal') ? 1.05 : 1,
  bossEssenceMultiplier: nodePurchased(state, 'hunter-trophy-hunter') ? 1.1 : 1,
  crystalCacheChanceMultiplier: nodePurchased(state, 'quartermaster-cache-appraisal') ? 1.1 : 1,
  arcaneFluxMultiplier: nodePurchased(state, 'tower-leyline-assistance') ? 1.05 : 1,
  transmutationSpeedMultiplier: nodePurchased(state, 'tower-efficient-arrays') ? 1.05 : 1,
  bonusAcolytes: nodePurchased(state, 'tower-expanded-quarters') ? 1 : 0,
})

export const getGuildPointsSpent = (state: Pick<GameState, 'progress'>) => Object.values(state.progress.guildSkillNodeRanks).reduce((sum, rank) => sum + Math.max(0, Math.floor(Number.isFinite(rank) ? rank : 0)), 0)
export const getGuildPointsAvailable = (state: Pick<GameState, 'progress'>) => Math.max(0, Math.floor(state.progress.guildPointsEarned) - getGuildPointsSpent(state))
export const getGuildRequestProgress = (state: Pick<GameState, 'progress'>, requestId: GuildRequestId) => Math.max(0, Math.floor(state.progress.requestProgress[requestId] ?? 0))
export const isGuildRequestComplete = (state: Pick<GameState, 'progress'>, requestId: GuildRequestId) => getGuildRequestProgress(state, requestId) >= GUILD_REQUESTS[requestId].target
export const getGuildRankOrder = () => [...rankOrder]
export const isGuildRankAtLeast = (current: GuildRankId, required: GuildRankId) => rankAtLeast(current, required)
export const isGuildSkillNodePurchased = (state: Pick<GameState, 'progress'>, nodeId: GuildSkillNodeId) => nodePurchased(state, nodeId)

export interface GuildPromotionRequirement {
  id: string
  label: string
  current: number
  target: number
  complete: boolean
}

export interface GuildPromotionProgress {
  currentRank: GuildRankDefinition
  nextRank: GuildRankDefinition | null
  eligible: boolean
  requirements: GuildPromotionRequirement[]
  contractClaims: number
}

export const getGuildContractClaimCount = (state: Pick<GameState, 'progress'>) => {
  const currentClaims = Object.values(GUILD_REQUESTS).filter((request) => Boolean(state.progress.requestClaims[request.id])).length
  const legacyClaims = Object.values(LEGACY_GUILD_REQUESTS).filter((request) => Boolean(state.progress.requestClaims[request.id]) || (state.progress.requestProgress[request.id] ?? 0) >= request.target).length
  return currentClaims + legacyClaims
}

export const getGuildPromotionProgress = (state: Pick<GameState, 'progress'>): GuildPromotionProgress => {
  const currentRank = GUILD_RANK_BY_ID[state.progress.guildRank] ?? GUILD_RANKS[0]
  const nextRank = GUILD_RANKS.find((rank) => rank.order === currentRank.order + 1) ?? null
  const promotion = nextRank?.promotion
  const contractClaims = getGuildContractClaimCount(state)
  const requirements: GuildPromotionRequirement[] = []
  if (promotion) {
    requirements.push({ id: 'reputation', label: 'Reputation', current: Math.max(0, Math.floor(state.progress.guildReputation)), target: promotion.reputation, complete: state.progress.guildReputation >= promotion.reputation })
    requirements.push({ id: 'contract-claims', label: 'Contract claims', current: contractClaims, target: promotion.requiredContractClaims, complete: contractClaims >= promotion.requiredContractClaims })
    for (const objectiveId of promotion.requiredChronicleObjectiveIds ?? []) {
      const complete = state.progress.chronicle.completedObjectiveIds.includes(objectiveId)
      requirements.push({ id: `chronicle:${objectiveId}`, label: 'Chronicle milestone', current: complete ? 1 : 0, target: 1, complete })
    }
  }
  // A persisted Initiate rank is sufficient evidence of Guild membership for
  // legacy saves whose old unlock flag was not serialized consistently.
  return { currentRank, nextRank, eligible: Boolean(nextRank && currentRank.id !== 'outsider' && requirements.every((requirement) => requirement.complete)), requirements, contractClaims }
}

export const canPurchaseGuildSkillNode = (state: Pick<GameState, 'progress'>, nodeId: GuildSkillNodeId) => {
  const node = GUILD_SKILL_NODES[nodeId]
  if (!node || getGuildPointsAvailable(state) < 1 || nodePurchased(state, nodeId)) return false
  if (node.prerequisiteId && !nodePurchased(state, node.prerequisiteId)) return false
  if (node.requiredRank && !rankAtLeast(state.progress.guildRank, node.requiredRank)) return false
  return true
}
