import { resolvePreferredHunterContractMonster } from '../../game/presentation/huntersOrder/hunterContractCombatPresentation'
import { doesMonsterMatchHunterContract } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import type { GameState } from '../../game/types'
import type { MonsterId } from '../../game/types'
import { setNavigationIntent } from './navigationIntent'

export function openHunterContractInCombat(state: GameState, setScreen: (screen: 'combat') => void, requestedMonsterId?: MonsterId | null) {
  const contract = state.progress.huntersOrder.activeContract
  if (!contract) return false
  const requestedTargetMatches = requestedMonsterId && doesMonsterMatchHunterContract(contract, requestedMonsterId, 'hunters-ground')
  setNavigationIntent({ combatDungeonId: 'hunters-ground', combatMonsterId: requestedTargetMatches ? requestedMonsterId : resolvePreferredHunterContractMonster(state) })
  setScreen('combat')
  return true
}
