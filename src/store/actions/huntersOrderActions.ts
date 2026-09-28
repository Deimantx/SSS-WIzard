import { reconcileChronicleProgress } from '../../game/systems/chronicles/chronicleRuntime'
import { acceptHunterContract, rerollHunterContracts, setHunterTargetBlocked, skipHunterContract, purchaseHunterUpgrade, debugSetHuntersOrderUnlocked, debugGrantHunterReputation, debugGrantHunterMarks, debugCompleteActiveHunterContract } from '../../game/systems/huntersOrder/huntersOrderRuntime'
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
