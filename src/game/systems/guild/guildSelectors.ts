import { GUILD_REQUESTS, LEGACY_GUILD_REQUESTS, type GuildRequestId } from '../../content/guild/guildRequests'
import { GUILD_RANKS, GUILD_RANK_BY_ID, type GuildRankDefinition } from '../../content/guild/guildRanks'
import { GUILD_SKILL_NODES, type GuildSkillNodeDefinition } from '../../content/guild/guildSkills'
import type { GameState, GuildRankId, GuildSkillNodeId } from '../../types'

const rankOrder: GuildRankId[] = ['outsider', 'initiate', 'apprentice', 'adept', 'magister', 'circle-master']
const rankAtLeast = (current: GuildRankId, required: GuildRankId) => rankOrder.indexOf(current) >= rankOrder.indexOf(required)
const nodePurchased = (state: Pick<GameState, 'progress'>, nodeId: GuildSkillNodeId) => (state.progress.guildSkillNodeRanks[nodeId] ?? 0) > 0

export interface GuildProgressionBonuses {
  /** Legacy consumers remain present at 1; Arcane Guild does not modify combat rewards. */
  combatArcanePointMultiplier: number
  combatResonanceMultiplier: number
  lifeEssenceMultiplier: number
  artifactEssenceMultiplier: number
  bossEssenceMultiplier: number
  crystalCacheChanceMultiplier: number
  researchSpeedMultiplier: number
  researchXpMultiplier: number
  guildReputationMultiplier: number
  transmutationOutputChance: number
  arcaneFluxMultiplier: number
  transmutationSpeedMultiplier: number
  bonusAcolytes: number
  commissionChoiceBonus: number
  deliveryQuantityMultiplier: number
  specialCommissionAccess: boolean
}

const rankForEffect = (state: Pick<GameState, 'progress'>, effect: GuildSkillNodeDefinition['effect']) => Object.values(GUILD_SKILL_NODES).filter((node) => node.effect === effect).reduce((sum, node) => sum + Math.max(0, Math.min(node.maxRank, Math.floor(state.progress.guildSkillNodeRanks[node.id] ?? 0))), 0)
const majorPurchased = (state: Pick<GameState, 'progress'>, nodeId: GuildSkillNodeId) => (state.progress.guildSkillNodeRanks[nodeId] ?? 0) > 0
export const getGuildProgressionBonuses = (state: Pick<GameState, 'progress'>): GuildProgressionBonuses => {
  const majorEfficiency = majorPurchased(state, 'major-arcane-efficiency') ? 0.02 : 0
  const coordination = majorPurchased(state, 'major-coordination') ? 0.02 : 0
  const grandStanding = majorPurchased(state, 'major-grand-standing') ? 0.03 : 0
  return {
    combatArcanePointMultiplier: 1, combatResonanceMultiplier: 1, lifeEssenceMultiplier: 1,
    artifactEssenceMultiplier: 1, bossEssenceMultiplier: 1, crystalCacheChanceMultiplier: 1,
    researchSpeedMultiplier: 1 + rankForEffect(state, 'research-speed') * 0.005 + majorEfficiency + coordination,
    researchXpMultiplier: 1 + rankForEffect(state, 'research-xp') * 0.01,
    guildReputationMultiplier: 1 + rankForEffect(state, 'guild-reputation') * 0.01 + grandStanding,
    transmutationOutputChance: Math.min(0.25, rankForEffect(state, 'transmutation-output') * 0.01),
    arcaneFluxMultiplier: 1 + rankForEffect(state, 'arcane-flux') * 0.01 + grandStanding,
    transmutationSpeedMultiplier: 1 + rankForEffect(state, 'transmutation-speed') * 0.01 + majorEfficiency + coordination,
    bonusAcolytes: rankForEffect(state, 'bonus-acolyte'),
    commissionChoiceBonus: majorPurchased(state, 'major-favored-contractor') ? 1 : 0,
    deliveryQuantityMultiplier: majorPurchased(state, 'major-efficient-procurement') ? 0.95 : 1,
    specialCommissionAccess: majorPurchased(state, 'major-guild-connections'),
  }
}

export const getGuildPointsSpent = (state: Pick<GameState, 'progress'>) => Object.values(state.progress.guildSkillNodeRanks).reduce((sum, rank) => sum + Math.max(0, Math.floor(Number.isFinite(rank) ? rank : 0)), 0)
export const getGuildPointsAvailable = (state: Pick<GameState, 'progress'>) => Math.max(0, Math.floor(state.progress.guildPointsEarned) - getGuildPointsSpent(state))
export const getGuildRequestProgress = (state: Pick<GameState, 'progress'>, requestId: GuildRequestId) => Math.max(0, Math.floor(state.progress.requestProgress[requestId] ?? 0))
export const isGuildRequestComplete = (state: Pick<GameState, 'progress'>, requestId: GuildRequestId) => getGuildRequestProgress(state, requestId) >= GUILD_REQUESTS[requestId].target
export const getGuildRankOrder = () => [...rankOrder]
export const isGuildRankAtLeast = (current: GuildRankId, required: GuildRankId) => rankAtLeast(current, required)
export const isGuildSkillNodePurchased = (state: Pick<GameState, 'progress'>, nodeId: GuildSkillNodeId) => (state.progress.guildSkillNodeRanks[nodeId] ?? 0) > 0

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
  return currentClaims
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
  const currentRank = state.progress.guildSkillNodeRanks[nodeId] ?? 0
  if (!node || getGuildPointsAvailable(state) < 1 || currentRank >= node.maxRank) return false
  if (node.requiredInvestedPoints !== undefined && getGuildPointsSpent(state) < node.requiredInvestedPoints) return false
  if (node.prerequisiteId && !nodePurchased(state, node.prerequisiteId)) return false
  if (node.requiredRank && !rankAtLeast(state.progress.guildRank, node.requiredRank)) return false
  return true
}
