import { resolvePreferredHunterContractMonster } from '../../game/presentation/huntersOrder/hunterContractCombatPresentation'
import { getEligibleHunterContractMembers } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import type { GameState } from '../../game/types'
import type { MonsterId } from '../../game/types'
import { setNavigationIntent } from './navigationIntent'

export function openHunterContractInCombat(state: GameState, setScreen: (screen: 'combat') => void, requestedMonsterId?: MonsterId | null) {
  const contract = state.progress.huntersOrder.activeContract
  if (!contract) return false
  const groundId = contract.huntingGroundId ?? 'hunters-ground'
  const eligibleMembers = getEligibleHunterContractMembers(state, contract, groundId)
  const requestedTargetMatches = requestedMonsterId && eligibleMembers.includes(requestedMonsterId)
  setNavigationIntent({ combatDungeonId: groundId, combatMonsterId: requestedTargetMatches ? requestedMonsterId : resolvePreferredHunterContractMonster(state, contract) })
  setScreen('combat')
  return true
}
