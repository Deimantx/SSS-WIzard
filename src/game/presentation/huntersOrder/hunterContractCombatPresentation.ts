import { MONSTERS } from '../../content/monsters'
import { doesMonsterMatchHunterContract, getEligibleHunterContractMembers, getHunterContractTargetLabel } from '../../systems/huntersOrder/huntersOrderRuntime'
import type { DungeonId, GameState, HunterContractState, MonsterId } from '../../types'

export type HunterContractMonsterRelation = 'exact-target' | 'eligible' | 'matching-but-locked' | 'not-eligible' | 'no-contract'

export function getMonsterHunterContractRelation(state: Pick<GameState, 'progress'>, monsterId: MonsterId, dungeonId: DungeonId): HunterContractMonsterRelation {
  const metadata = MONSTERS[monsterId]?.hunter
  if (!metadata?.exclusive || metadata.huntingGroundId !== dungeonId) return 'not-eligible'
  const contract = state.progress.huntersOrder.activeContract
  if (!contract) return 'no-contract'
  if (!doesMonsterMatchHunterContract(contract, monsterId, dungeonId)) return 'not-eligible'
  if (!getEligibleHunterContractMembers(state, contract, dungeonId).includes(monsterId)) return 'matching-but-locked'
  return contract.targetSpec.type === 'monster' ? 'exact-target' : 'eligible'
}

export function resolvePreferredHunterContractMonster(state: Pick<GameState, 'progress' | 'combat' | 'ui'>): MonsterId | null {
  const contract = state.progress.huntersOrder.activeContract
  if (!contract) return null
  const matches = getEligibleHunterContractMembers(state, contract, 'hunters-ground')
  if (!matches.length) return null
  const currentTarget = state.combat.targetEnemyId
  const wasAtGloamridge = state.combat.dungeonId === 'hunters-ground' || state.ui.lastEnteredCombatDungeonId === 'hunters-ground'
  return wasAtGloamridge && currentTarget && matches.includes(currentTarget) ? currentTarget : matches[0]
}

export function getHunterContractCombatPresentation(state: Pick<GameState, 'progress' | 'combat' | 'ui'>) {
  const contract = state.progress.huntersOrder.activeContract
  const matchingMonsterIds: MonsterId[] = contract ? getEligibleHunterContractMembers(state, contract, 'hunters-ground') : []
  return {
    active: Boolean(contract),
    contract,
    label: contract ? getHunterContractTargetLabel(contract) : 'None',
    archetypeLabel: contract ? contract.targetSpec.type === 'monster' ? 'HUNT' : contract.targetSpec.type === 'family' ? 'CULL' : contract.targetSpec.type === 'alignment' ? 'PURSUE' : 'PATROL' : null,
    progress: contract?.progress ?? 0,
    target: contract?.target ?? 0,
    remaining: contract ? Math.max(0, contract.target - contract.progress) : 0,
    rewardReputation: contract?.reputationReward ?? 0,
    rewardMarks: contract?.marksReward ?? 0,
    matchingMonsterIds,
    preferredMonsterId: contract ? resolvePreferredHunterContractMonster(state) : null,
    relationFor: (monsterId: MonsterId, dungeonId: DungeonId) => getMonsterHunterContractRelation(state, monsterId, dungeonId),
  }
}

export function getHunterContractEligibleCount(state: Pick<GameState, 'progress'>, contract: HunterContractState | null) {
  return contract ? getEligibleHunterContractMembers(state, contract, 'hunters-ground').length : 0
}
