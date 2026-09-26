import { GUILD_REQUESTS, GUILD_REQUEST_IDS } from '../../game/content/guild/guildRequests'
import { claimGuildRequest, donateGuildRequest, promoteGuild, purchaseGuildSkillNode, resetGuildRequests, resetGuildSkillTree, setGuildRank, grantGuildPoint } from '../../game/systems/guild/guildRuntime'
import { reconcileChronicleProgress } from '../../game/systems/chronicles/chronicleRuntime'
import type { GameState, GuildRankId, GuildSkillNodeId } from '../../game/types'

const LEGACY_REQUEST_IDS = ['arcane-supply', 'clear-the-woods', 'sentinel-breaker'] as const
const validRequestId = (requestId: string): requestId is keyof typeof GUILD_REQUESTS => GUILD_REQUEST_IDS.includes(requestId as keyof typeof GUILD_REQUESTS) || LEGACY_REQUEST_IDS.includes(requestId as typeof LEGACY_REQUEST_IDS[number])

export const donateGuildRequestAction = (state: GameState, requestId: string, amount: number | 'max') => validRequestId(requestId) && donateGuildRequest(state, requestId, amount)
export const claimGuildRewardAction = (state: GameState, requestId: string) => {
  const claimed = validRequestId(requestId) && claimGuildRequest(state, requestId)
  if (claimed) reconcileChronicleProgress(state)
  return claimed
}
export const promoteGuildAction = (state: GameState) => {
  const promoted = promoteGuild(state)
  if (promoted) reconcileChronicleProgress(state)
  return promoted
}
export const purchaseGuildSkillNodeAction = (state: GameState, nodeId: GuildSkillNodeId, free = false) => purchaseGuildSkillNode(state, nodeId, free)
export const resetGuildSkillTreeAction = (state: GameState) => resetGuildSkillTree(state)
export const resetGuildRequestsAction = (state: GameState) => resetGuildRequests(state)
export const setGuildRankAction = (state: GameState, rank: GuildRankId) => setGuildRank(state, rank)
export const grantGuildPointAction = (state: GameState, amount: number) => grantGuildPoint(state, amount)
