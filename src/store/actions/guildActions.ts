import { GUILD_REQUESTS, GUILD_REQUEST_IDS } from '../../game/content/guild/guildRequests'
import { grantGuildReputation as grantGuildReputationValue } from '../../game/systems/guild/guildReputation'
import { claimGuildRequest, donateGuildRequest, promoteGuild, purchaseGuildSkillNode, resetGuildRequests, resetGuildSkillTree, setGuildRank, grantGuildPoint, debugSetArcaneGuildUnlocked, debugSetGuildSkillNodeRank, debugSetAllGuildSkillRanks, debugSetGuildReputation } from '../../game/systems/guild/guildRuntime'
import { reconcileChronicleProgress } from '../../game/systems/chronicles/chronicleRuntime'
import { debugCompleteRegistryEntry, debugCompleteRegistrySet, debugResetRegistrySet, registerArcaneRegistryEntry } from '../../game/systems/guild/arcaneRegistry'
import { acceptGuildCommission, contributeGuildCommissionSupply, deliverGuildCommissionItems, refreshGuildCommissionChoices, debugSetGuildCommissionRngSeed, debugRegenerateGuildCommissionBoard, debugCompleteActiveGuildCommission } from '../../game/systems/guild/guildCommissions'
import type { GuildCommissionGenerationOptions } from '../../game/systems/guild/guildCommissions'
import { contributeGuildProject, debugCompleteGuildProject, debugCompleteGuildProjectPrerequisites, debugGrantGuildProjectRequirements } from '../../game/systems/guild/guildProjects'
import { contributeGuildCommissionChainDelivery, debugCompleteGuildCommissionChain, startGuildCommissionChain, debugCompleteGuildStudyStage, debugResetGuildStudy, debugSetGuildStudyFirstClear } from '../../game/systems/guild/guildCommissionChains'
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
export const debugSetGuildReputationAction = (state: GameState, amount: number) => debugSetGuildReputation(state, amount)
export const debugSetGuildSkillNodeRankAction = (state: GameState, id: GuildSkillNodeId, rank: number) => debugSetGuildSkillNodeRank(state, id, rank)
export const debugSetAllGuildSkillRanksAction = (state: GameState, mode: 'max' | 'reset') => debugSetAllGuildSkillRanks(state, mode)

export const registerArcaneRegistryEntryAction = (state: GameState, itemId: import('../../game/types').ItemId) => registerArcaneRegistryEntry(state, itemId)
export const acceptGuildCommissionAction = (state: GameState, id: string) => acceptGuildCommission(state, id)
export const deliverGuildCommissionItemsAction = (state: GameState, amount: number | 'max') => deliverGuildCommissionItems(state, amount)
export const contributeGuildCommissionSupplyAction = (state: GameState, objectiveIndex: number, amount: number | 'max') => contributeGuildCommissionSupply(state, objectiveIndex, amount)
export const refreshGuildCommissionChoicesAction = (state: GameState) => refreshGuildCommissionChoices(state)
export const debugSetGuildCommissionRngSeedAction = (state: GameState, seed: number) => debugSetGuildCommissionRngSeed(state, seed)
export const debugRegenerateGuildCommissionBoardAction = (state: GameState, options: GuildCommissionGenerationOptions = {}) => debugRegenerateGuildCommissionBoard(state, options)
export const debugCompleteActiveGuildCommissionAction = (state: GameState) => debugCompleteActiveGuildCommission(state)

export const contributeGuildProjectAction = (state: GameState, projectId: string, itemId: import('../../game/types').ItemId, amount: number | 'max') => contributeGuildProject(state, projectId, itemId, amount)
export const startGuildCommissionChainAction = (state: GameState, chainId: string) => startGuildCommissionChain(state, chainId)
export const contributeGuildCommissionChainDeliveryAction = (state: GameState, amount: number | 'max') => contributeGuildCommissionChainDelivery(state, amount)
export const debugCompleteGuildProjectAction = (state: GameState, id: string) => debugCompleteGuildProject(state, id)
export const debugGrantGuildProjectRequirementsAction = (state: GameState, id: string) => debugGrantGuildProjectRequirements(state, id)
export const debugCompleteGuildProjectPrerequisitesAction = (state: GameState, id: string) => debugCompleteGuildProjectPrerequisites(state, id)
export const debugCompleteGuildCommissionChainAction = (state: GameState, id: string) => debugCompleteGuildCommissionChain(state, id)
export const debugCompleteGuildStudyStageAction = (state: GameState) => debugCompleteGuildStudyStage(state)
export const debugResetGuildStudyAction = (state: GameState, id: string) => debugResetGuildStudy(state, id)
export const debugSetGuildStudyFirstClearAction = (state: GameState, id: string, complete: boolean) => debugSetGuildStudyFirstClear(state, id, complete)
export const debugGrantGuildReputationAction = (state: GameState, amount: number) => { grantGuildReputationValue(state, amount); reconcileChronicleProgress(state) }
export const debugSetArcaneGuildUnlockedAction = (state: GameState, enabled: boolean) => debugSetArcaneGuildUnlocked(state, enabled)
export const debugCompleteRegistryEntryAction = (state: GameState, id: import('../../game/types').ItemId) => debugCompleteRegistryEntry(state, id)
export const debugCompleteRegistrySetAction = (state: GameState, id: string) => debugCompleteRegistrySet(state, id)
export const debugResetRegistrySetAction = (state: GameState, id: string) => debugResetRegistrySet(state, id)
