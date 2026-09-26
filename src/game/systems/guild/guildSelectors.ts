import { GUILD_REQUESTS, type GuildRequestId } from '../../content/guild/guildRequests'
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

export const canPurchaseGuildSkillNode = (state: Pick<GameState, 'progress'>, nodeId: GuildSkillNodeId) => {
  const node = GUILD_SKILL_NODES[nodeId]
  if (!node || getGuildPointsAvailable(state) < 1 || nodePurchased(state, nodeId)) return false
  if (node.prerequisiteId && !nodePurchased(state, node.prerequisiteId)) return false
  if (node.requiredRank && !rankAtLeast(state.progress.guildRank, node.requiredRank)) return false
  return true
}
