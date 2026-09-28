import { GUILD_REQUESTS, GUILD_REQUEST_IDS } from '../../game/content/guild/guildRequests'
import { claimGuildRequest, donateGuildRequest, promoteGuild, purchaseGuildSkillNode, resetGuildRequests, resetGuildSkillTree, setGuildRank, grantGuildPoint, debugSetArcaneGuildUnlocked } from '../../game/systems/guild/guildRuntime'
import { reconcileChronicleProgress } from '../../game/systems/chronicles/chronicleRuntime'
import { debugCompleteRegistryEntry, debugCompleteRegistrySet, registerArcaneRegistryEntry } from '../../game/systems/guild/arcaneRegistry'
import { acceptGuildCommission, deliverGuildCommissionItems, refreshGuildCommissionChoices } from '../../game/systems/guild/guildCommissions'
import { contributeGuildProject, debugCompleteGuildProject } from '../../game/systems/guild/guildProjects'
import { contributeGuildCommissionChainDelivery, debugCompleteGuildCommissionChain, startGuildCommissionChain } from '../../game/systems/guild/guildCommissionChains'
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

export const registerArcaneRegistryEntryAction = (state: GameState, itemId: import('../../game/types').ItemId) => registerArcaneRegistryEntry(state, itemId)
export const acceptGuildCommissionAction = (state: GameState, id: string) => acceptGuildCommission(state, id)
export const deliverGuildCommissionItemsAction = (state: GameState, amount: number | 'max') => deliverGuildCommissionItems(state, amount)
export const refreshGuildCommissionChoicesAction = (state: GameState) => refreshGuildCommissionChoices(state)

export const contributeGuildProjectAction = (state: GameState, projectId: string, itemId: import('../../game/types').ItemId, amount: number | 'max') => contributeGuildProject(state, projectId, itemId, amount)
export const startGuildCommissionChainAction = (state: GameState, chainId: string) => startGuildCommissionChain(state, chainId)
export const contributeGuildCommissionChainDeliveryAction = (state: GameState, amount: number | 'max') => contributeGuildCommissionChainDelivery(state, amount)
export const debugCompleteGuildProjectAction = (state: GameState, id: string) => debugCompleteGuildProject(state, id)
export const debugCompleteGuildCommissionChainAction = (state: GameState, id: string) => debugCompleteGuildCommissionChain(state, id)
export const debugGrantGuildReputationAction = (state: GameState, amount: number) => { state.progress.guildReputation = Math.max(0, Math.floor(state.progress.guildReputation + amount)); reconcileChronicleProgress(state) }
export const debugSetArcaneGuildUnlockedAction = (state: GameState, enabled: boolean) => debugSetArcaneGuildUnlocked(state, enabled)
export const debugCompleteRegistryEntryAction = (state: GameState, id: import('../../game/types').ItemId) => debugCompleteRegistryEntry(state, id)
export const debugCompleteRegistrySetAction = (state: GameState, id: string) => debugCompleteRegistrySet(state, id)
