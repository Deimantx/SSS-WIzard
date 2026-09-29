import { reconcileChronicleProgress } from '../../game/systems/chronicles/chronicleRuntime'
import { acceptHunterContract, rerollHunterContracts, setHunterTargetBlocked, skipHunterContract, purchaseHunterUpgrade, clearHunterTargetBlocks, debugSetHuntersOrderUnlocked, debugGrantHunterReputation, debugGrantHunterMarks, debugCompleteActiveHunterContract, debugSetHunterRngSeed, debugRegenerateHunterContractBoard, debugSetHunterRank, debugGrantHunterUpgrade, debugGrantNightglassBossContract, debugSetHunterApexThreatReady } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import type { HunterContractGenerationOptions } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import type { GameState, MonsterId } from '../../game/types'

export const acceptHunterContractAction = (state: GameState, id: string) => acceptHunterContract(state, id)
export const skipHunterContractAction = (state: GameState) => skipHunterContract(state)
export const rerollHunterContractsAction = (state: GameState) => rerollHunterContracts(state)
export const purchaseHunterUpgradeAction = (state: GameState, id: string) => purchaseHunterUpgrade(state, id)
export const setHunterTargetBlockedAction = (state: GameState, id: MonsterId, blocked: boolean) => setHunterTargetBlocked(state, id, blocked)

export const debugSetHuntersOrderUnlockedAction = (state: GameState, value: boolean) => { debugSetHuntersOrderUnlocked(state, value); reconcileChronicleProgress(state) }
export const debugGrantHunterReputationAction = (state: GameState, amount: number) => debugGrantHunterReputation(state, amount)
export const debugGrantHunterMarksAction = (state: GameState, amount: number) => debugGrantHunterMarks(state, amount)
export const debugCompleteActiveHunterContractAction = (state: GameState) => debugCompleteActiveHunterContract(state)
export const debugSetHunterRngSeedAction = (state: GameState, seed: number) => debugSetHunterRngSeed(state, seed)
export const debugRegenerateHunterContractBoardAction = (state: GameState, options: HunterContractGenerationOptions = {}) => debugRegenerateHunterContractBoard(state, options)
export const debugSetHunterRankAction = (state: GameState, rankId: import('../../game/types').HunterRankId) => debugSetHunterRank(state, rankId)
export const debugGrantHunterUpgradeAction = (state: GameState, upgradeId: string) => debugGrantHunterUpgrade(state, upgradeId)
export const clearHunterTargetBlocksAction = (state: GameState) => clearHunterTargetBlocks(state)
export const debugClearHunterTargetBlocksAction = clearHunterTargetBlocksAction
export const debugGrantNightglassBossContractAction = (state: GameState) => debugGrantNightglassBossContract(state)
export const debugSetHunterApexThreatReadyAction = (state: GameState) => debugSetHunterApexThreatReady(state)
